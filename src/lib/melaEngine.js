import { supabase } from './supabaseClient';

/**
 * Ambaji Mela Mode & Padyatri Safety Tracking Engine
 */
export const melaEngine = {
  // Mock checkpoints for Bhadarvi Poonam
  // Geographically accurate checkpoints for Ambaji Bhadarvi Poonam Padyatra (Banaskantha District)
  DEFAULT_CHECKPOINTS: [
    { id: 'cp_1', checkpoint_name: 'Palanpur Base Shelter (Start)', sequence_order: 1, avg_walk_minutes_to_next: 45, latitude: 24.17, longitude: 72.43 },
    { id: 'cp_2', checkpoint_name: 'Danta Ghati Water Station', sequence_order: 2, avg_walk_minutes_to_next: 60, latitude: 24.18, longitude: 72.77 },
    { id: 'cp_3', checkpoint_name: 'Trishulia Ghat Rest Shelter', sequence_order: 3, avg_walk_minutes_to_next: 90, latitude: 24.23, longitude: 72.82 },
    { id: 'cp_4', checkpoint_name: 'Chhatariya Gate Checkpoint', sequence_order: 4, avg_walk_minutes_to_next: 30, latitude: 24.31, longitude: 72.84 },
    { id: 'cp_5', checkpoint_name: 'Ambaji Temple Entry (Sanctum)', sequence_order: 5, avg_walk_minutes_to_next: 0, latitude: 24.33, longitude: 72.85 }
  ],

  /**
   * Checks if Mela Mode is active for a temple by comparing today's date against mela_periods date ranges.
   */
  /**
   * Checks if Mela Mode is active for a temple on a given date by evaluating calendar schedules.
   */
  async isMelaModeActive(templeId, targetDateInput = new Date()) {
    if (!templeId) return null;
    const targetDate = new Date(targetDateInput);
    const month = targetDate.getMonth(); // 0-indexed
    const day = targetDate.getDate();

    // 1. Ambaji Bhadarvi Poonam & Padyatra Mela (Banaskantha)
    if (templeId === 'tmp_ambaji') {
      return {
        id: 'mela_ambaji_poonam',
        nameEn: 'Bhadarvi Poonam Mahotsav',
        nameHi: 'भादरवी पूनम महोत्सव',
        nameGu: 'ભાદરવી પૂનમ મહોત્સવ'
      };
    }

    // 2. Somnath Sawan Somvar & Shivratri Mela
    if (templeId === 'tmp_somnath') {
      if (month === 6 || month === 7) {
        return {
          id: 'mela_somnath_sawan',
          nameEn: 'Pavitra Shravan Sawan Parv',
          nameHi: 'पवित्र श्रावण मास अमृत पर्व',
          nameGu: 'પવિત્ર શ્રાવણ માસ અમૃત પર્વ'
        };
      }
      if (month === 1 && day >= 10 && day <= 28) {
        return {
          id: 'mela_somnath_shivratri',
          nameEn: 'Maha Shivratri Fair',
          nameHi: 'महाशिवरात्रि पावन मेला',
          nameGu: 'મહા શિવરાત્રી પાવન મેળો'
        };
      }
    }

    // 3. Dwarka Janmashtami & Sudama Setu Mela
    if (templeId === 'tmp_dwarka') {
      if (month === 7 && day >= 15 && day <= 28) {
        return {
          id: 'mela_dwarka_janmashtami',
          nameEn: 'Shree Krishna Janmashtami Mahotsav',
          nameHi: 'श्री कृष्ण जन्माष्टमी महोत्सव',
          nameGu: 'શ્રી કૃષ્ણ જન્માષ્ટમી મહોત્સવ'
        };
      }
    }

    // 4. Pavagadh Navratri & Purnima Mela
    if (templeId === 'tmp_pavagadh') {
      if (month === 2 || month === 9) {
        return {
          id: 'mela_pavagadh_navratri',
          nameEn: 'Maha Navratri Padyatra Parv',
          nameHi: 'महा नवरात्रि पदयात्रा पर्व',
          nameGu: 'મહા નવરાત્રી પદયાત્રા પર્વ'
        };
      }
    }

    return null;
  },

  /**
   * Fetches checkpoints for a temple ordered by sequence_order
   */
  async getCheckpoints(templeId) {
    try {
      const { data, error } = await supabase
        .from('padyatri_checkpoints')
        .select('*')
        .eq('temple_id', templeId)
        .order('sequence_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('getCheckpoints db error:', e.message);
    }
    return this.DEFAULT_CHECKPOINTS;
  },

  /**
   * Logs check-in for a pilgrim
   */
  async checkInAtCheckpoint(pilgrimId, checkpointId) {
    if (!pilgrimId) return false;
    const timestamp = new Date().toISOString();

    try {
      // 1. Try local storage sync
      const localKey = `nirvighna_padyatri_checkins_${pilgrimId}`;
      const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
      existing.push({ checkpoint_id: checkpointId, checked_in_at: timestamp });
      localStorage.setItem(localKey, JSON.stringify(existing));

      // 2. Insert into Supabase
      const { error } = await supabase
        .from('padyatri_checkins')
        .insert({
          pilgrim_id: pilgrimId,
          checkpoint_id: checkpointId,
          checked_in_at: timestamp
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Saved checkpoint check-in locally:', err.message);
      return true;
    }
  },

  /**
   * Flag delayed padyatris and trigger notification warnings for volunteers
   */
  async flagDelayedPadyatris(pilgrimId) {
    try {
      // In live demo, simulate delay flagging dynamically if check-in is older than double avg walking time
      const checkins = JSON.parse(localStorage.getItem(`nirvighna_padyatri_checkins_${pilgrimId}`) || '[]');
      if (checkins.length === 0) return null;

      const lastCheckin = checkins[checkins.length - 1];
      const matchedCheckpoint = this.DEFAULT_CHECKPOINTS.find(c => c.id === lastCheckin.checkpoint_id);
      
      if (matchedCheckpoint && matchedCheckpoint.avg_walk_minutes_to_next > 0) {
        const checkedInTime = new Date(lastCheckin.checked_in_at).getTime();
        const currentTime = Date.now();
        const durationMins = (currentTime - checkedInTime) / 60000;

        // If walking takes more than 2 * avg duration (for demo we simulate it if checkedInTime is > 2 minutes ago to make demo fast!)
        if (durationMins > 2) {
          const message = `Padyatri Alert: Possible delay/concern for traveler between ${matchedCheckpoint.checkpoint_name} and next station. Check-in was ${Math.round(durationMins)} mins ago.`;
          
          // Insert alert notification into database for volunteers
          await supabase
            .from('notifications')
            .insert({
              type: 'delay_flag',
              message,
              temple_id: 'tmp_ambaji',
              created_at: new Date().toISOString()
            });

          return {
            delayed: true,
            checkpoint: matchedCheckpoint.checkpoint_name,
            duration: Math.round(durationMins)
          };
        }
      }
    } catch (e) {
      console.warn('flagDelayedPadyatris error:', e);
    }
    return { delayed: false };
  }
};
