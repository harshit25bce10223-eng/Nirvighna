package org.nirvighna.pilgrim;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import java.util.List;
import android.graphics.Color;
import android.media.AudioManager;
import android.net.Uri;

import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.app.NotificationCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Locale;


public class MainActivity extends BridgeActivity {

    private TextToSpeech textToSpeech;
    private static final String NOTIF_CHANNEL_ID = "nirvighna_pilgrim_alerts";
    private static final String NOTIF_CHANNEL_NAME = "Nirvighna Pilgrim Alerts";
    private volatile boolean isUpdateDownloading = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable full Hardware Acceleration
        if (getWindow() != null) {
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
            );
            if (getWindow().getDecorView() != null) {
                getWindow().getDecorView().setBackgroundColor(Color.parseColor("#0F0D22"));
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                getWindow().setStatusBarColor(Color.parseColor("#0F0D22"));
            }
        }

        // Initialize Android System Notification Channel
        createNotificationChannel();

        // Request POST_NOTIFICATIONS on Android 13+
        if (Build.VERSION.SDK_INT >= 33) {
            if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
            }
        }

        // Initialize Native Android Text-To-Speech Engine for Crystal Clear Voice
        initNativeTTS();

        if (this.bridge != null && this.bridge.getWebView() != null) {
            final WebView webView = this.bridge.getWebView();
            webView.setBackgroundColor(Color.parseColor("#FAF7F2"));
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);

            // Check if app was just updated and relaunched
            if (getIntent() != null && getIntent().getBooleanExtra("nirvighna_just_updated", false)) {
                webView.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        webView.evaluateJavascript(
                            "try { localStorage.setItem('nirvighna_just_updated', 'true'); window.dispatchEvent(new CustomEvent('nirvighna_just_updated')); } catch(e){}",
                            null
                        );
                    }
                }, 800);
            }

            // Handle incoming deep links (e.g. Email verification links)
            handleDeepLinkIntent(getIntent());

            // Comprehensive Native Bridge (TTS, System Notifications & 1-Tap In-App APK Updater)
            webView.addJavascriptInterface(new Object() {


                @JavascriptInterface
                public void speakText(final String text, final String langCode) {
                    if (text == null || text.trim().isEmpty()) return;
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                if (textToSpeech == null) {
                                    initNativeTTS();
                                }
                                if (textToSpeech != null) {
                                    Locale targetLocale = new Locale("hi", "IN");
                                    if ("gu".equalsIgnoreCase(langCode)) {
                                        int avail = textToSpeech.isLanguageAvailable(new Locale("gu", "IN"));
                                        if (avail >= TextToSpeech.LANG_AVAILABLE) {
                                            targetLocale = new Locale("gu", "IN");
                                        } else {
                                            targetLocale = new Locale("hi", "IN");
                                        }
                                    } else if ("en".equalsIgnoreCase(langCode)) {
                                        targetLocale = new Locale("en", "IN");
                                    } else {
                                        targetLocale = new Locale("hi", "IN");
                                    }

                                    int langResult = textToSpeech.setLanguage(targetLocale);
                                    if (langResult == TextToSpeech.LANG_MISSING_DATA || langResult == TextToSpeech.LANG_NOT_SUPPORTED) {
                                        textToSpeech.setLanguage(Locale.ENGLISH);
                                    }

                                    textToSpeech.setSpeechRate(0.95f);
                                    textToSpeech.setPitch(1.0f);

                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                                        Bundle params = new Bundle();
                                        params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
                                        params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC);
                                        textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, params, "nirvighna_tts_" + System.currentTimeMillis());
                                    } else {
                                        HashMap<String, String> params = new HashMap<>();
                                        params.put(TextToSpeech.Engine.KEY_PARAM_VOLUME, "1.0");
                                        params.put(TextToSpeech.Engine.KEY_PARAM_STREAM, String.valueOf(AudioManager.STREAM_MUSIC));
                                        textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, params);
                                    }
                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }
                    });
                }

                @JavascriptInterface
                public void stopSpeech() {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                if (textToSpeech != null && textToSpeech.isSpeaking()) {
                                    textToSpeech.stop();
                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }
                    });
                }


                @JavascriptInterface
                public void showSystemNotification(final String title, final String message, final String tag) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            sendNativeNotification(title, message);
                        }
                    });
                }

                @JavascriptInterface
                public boolean canInstallPackages() {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        return getPackageManager().canRequestPackageInstalls();
                    }
                    return true;
                }

                @JavascriptInterface
                public void requestInstallPermission() {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                Intent permIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                                permIntent.setData(Uri.parse("package:" + getPackageName()));
                                permIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                startActivity(permIntent);
                            }
                        }
                    });
                }

                @JavascriptInterface
                public void startInAppUpdate(final String apkUrl, final String expectedSha256) {
                    if (isUpdateDownloading) {
                        return; // Prevent duplicate concurrent downloads
                    }

                    isUpdateDownloading = true;

                    new Thread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                dispatchUpdateState("downloading", "Starting background update download...");

                                File outputDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                                if (outputDir == null) {
                                    outputDir = getCacheDir();
                                }
                                final File outputFile = new File(outputDir, "Nirvighna-Pilgrim-Update.apk");
                                if (outputFile.exists()) {
                                    outputFile.delete();
                                }

                                String currentUrlStr = apkUrl;
                                URL url = new URL(currentUrlStr);
                                HttpURLConnection conn = null;
                                int redirects = 0;
                                while (redirects < 6) {
                                    conn = (HttpURLConnection) url.openConnection();
                                    conn.setInstanceFollowRedirects(true);
                                    conn.setConnectTimeout(15000);
                                    conn.setReadTimeout(30000);
                                    conn.setRequestProperty("User-Agent", "Nirvighna-Android-Updater");
                                    conn.connect();

                                    int responseCode = conn.getResponseCode();
                                    if (responseCode >= 300 && responseCode < 400) {
                                        String redirectUrl = conn.getHeaderField("Location");
                                        if (redirectUrl == null) break;
                                        conn.disconnect();
                                        url = new URL(url, redirectUrl);
                                        redirects++;
                                    } else if (responseCode == HttpURLConnection.HTTP_OK) {
                                        break;
                                    } else {
                                        throw new Exception("Server returned HTTP " + responseCode + " while fetching update.");
                                    }
                                }

                                if (conn == null) throw new Exception("Unable to establish connection to update server.");

                                long contentLength = conn.getContentLength();
                                InputStream is = conn.getInputStream();
                                FileOutputStream fos = new FileOutputStream(outputFile);
                                byte[] buffer = new byte[16384];
                                int len;
                                long totalBytesRead = 0;
                                long lastProgressTime = 0;

                                while ((len = is.read(buffer)) != -1) {
                                    fos.write(buffer, 0, len);
                                    totalBytesRead += len;

                                    long now = System.currentTimeMillis();
                                    if (now - lastProgressTime > 150) {
                                        int percent = contentLength > 0 ? (int) ((totalBytesRead * 100) / contentLength) : -1;
                                        dispatchUpdateProgress(percent, totalBytesRead, contentLength);
                                        lastProgressTime = now;
                                    }
                                }
                                fos.flush();
                                fos.close();
                                is.close();
                                conn.disconnect();

                                // 100% Downloaded
                                dispatchUpdateProgress(100, totalBytesRead, contentLength);

                                // Transition to State 2: Verifying Cryptographic Integrity
                                dispatchUpdateState("verifying", "Verifying package integrity & SHA-256 checksum...");

                                if (expectedSha256 != null && !expectedSha256.trim().isEmpty() && !expectedSha256.equalsIgnoreCase("skip")) {
                                    String computedHash = calculateSha256(outputFile);
                                    if (!computedHash.equalsIgnoreCase(expectedSha256.trim())) {
                                        isUpdateDownloading = false;
                                        dispatchUpdateError("HASH_MISMATCH", "Cryptographic verification failed: SHA-256 checksum mismatch.");
                                        return;
                                    }
                                }

                                // Transition to State 3: Ready to Install
                                dispatchUpdateState("ready", "Package verified! Launching package installer...");

                                Thread.sleep(400);

                                isUpdateDownloading = false;

                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        installApkFile(outputFile);
                                    }
                                });

                            } catch (final Exception e) {
                                e.printStackTrace();
                                isUpdateDownloading = false;
                                dispatchUpdateError("DOWNLOAD_FAILED", e.getMessage() != null ? e.getMessage() : "Network error during update download.");
                            }
                        }
                    }).start();
                }

                @JavascriptInterface
                public void downloadAndInstallApk(final String apkUrl) {
                    startInAppUpdate(apkUrl, "skip");
                }

                @JavascriptInterface
                public boolean isNativeBridge() {
                    return true;
                }

                @JavascriptInterface
                public boolean isNativeUpdater() {
                    return true;
                }
            }, "NirvighnaNativeBridge");

            // Also keep updater alias
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void startInAppUpdate(final String apkUrl, final String expectedSha256) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            webView.evaluateJavascript("if(window.NirvighnaNativeBridge && window.NirvighnaNativeBridge.startInAppUpdate){ window.NirvighnaNativeBridge.startInAppUpdate('" + apkUrl + "', '" + expectedSha256 + "'); }", null);
                        }
                    });
                }
                @JavascriptInterface
                public void downloadAndInstallApk(final String apkUrl) {
                    startInAppUpdate(apkUrl, "skip");
                }
                @JavascriptInterface
                public boolean isNativeUpdater() {
                    return true;
                }
            }, "NirvighnaNativeUpdater");
        }
    }

    private void dispatchUpdateProgress(final int percent, final long downloadedBytes, final long totalBytes) {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    String js = String.format(
                        Locale.US,
                        "window.dispatchEvent(new CustomEvent('nirvighna_update_progress', { detail: { percent: %d, downloadedBytes: %d, totalBytes: %d } }));",
                        percent, downloadedBytes, totalBytes
                    );
                    bridge.getWebView().evaluateJavascript(js, null);
                }
            });
        }
    }

    private void dispatchUpdateState(final String state, final String message) {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    String js = String.format(
                        "window.dispatchEvent(new CustomEvent('nirvighna_update_state', { detail: { state: '%s', message: '%s' } }));",
                        state, message.replace("'", "\\'")
                    );
                    bridge.getWebView().evaluateJavascript(js, null);
                }
            });
        }
    }

    private void dispatchUpdateError(final String code, final String message) {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    String js = String.format(
                        "window.dispatchEvent(new CustomEvent('nirvighna_update_error', { detail: { code: '%s', message: '%s' } }));",
                        code, message.replace("'", "\\'")
                    );
                    bridge.getWebView().evaluateJavascript(js, null);
                }
            });
        }
    }

    private String calculateSha256(File file) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            FileInputStream fis = new FileInputStream(file);
            byte[] buffer = new byte[8192];
            int len;
            while ((len = fis.read(buffer)) != -1) {
                md.update(buffer, 0, len);
            }
            fis.close();
            byte[] hashBytes = md.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private void initNativeTTS() {
        try {
            textToSpeech = new TextToSpeech(getApplicationContext(), new TextToSpeech.OnInitListener() {
                @Override
                public void onInit(int status) {
                    if (status == TextToSpeech.SUCCESS && textToSpeech != null) {
                        int res = textToSpeech.setLanguage(new Locale("hi", "IN"));
                        if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                            textToSpeech.setLanguage(Locale.ENGLISH);
                        }
                    }
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                NOTIF_CHANNEL_ID,
                NOTIF_CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Live crowd safety, darshan pass updates, and emergency alerts");
            channel.enableLights(true);
            channel.setLightColor(Color.parseColor("#EBB239"));
            channel.enableVibration(true);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void sendNativeNotification(String title, String message) {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;

            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, intent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, NOTIF_CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title != null ? title : "Nirvighna Pilgrim Portal")
                .setContentText(message != null ? message : "New Darshan safety update available.")
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message != null ? message : ""))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setVibrate(new long[]{0, 250, 100, 250})
                .setAutoCancel(true)
                .setColor(Color.parseColor("#800020"))
                .setContentIntent(pendingIntent);

            manager.notify((int) (System.currentTimeMillis() % 100000), builder.build());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private File pendingApkToInstall = null;

    private void installApkFile(File apkFile) {
        if (apkFile == null || !apkFile.exists()) {
            Toast.makeText(this, "Update file not found. Please retry download.", Toast.LENGTH_SHORT).show();
            return;
        }

        pendingApkToInstall = apkFile;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!getPackageManager().canRequestPackageInstalls()) {
                    Intent permIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    permIntent.setData(Uri.parse("package:" + getPackageName()));
                    permIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(permIntent);
                    Toast.makeText(this, "Please allow 'Install unknown apps' to complete the update.", Toast.LENGTH_LONG).show();
                    return;
                }
            }

            Uri apkUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apkFile);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            // Grant explicit URI read permission to package installer
            List<ResolveInfo> resInfoList = getPackageManager().queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY);
            for (ResolveInfo resolveInfo : resInfoList) {
                String packageName = resolveInfo.activityInfo.packageName;
                grantUriPermission(packageName, apkUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }

            startActivity(intent);
            pendingApkToInstall = null;
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, "Could not open installer: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (pendingApkToInstall != null && pendingApkToInstall.exists()) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getPackageManager().canRequestPackageInstalls()) {
                File toInstall = pendingApkToInstall;
                pendingApkToInstall = null;
                installApkFile(toInstall);
            }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLinkIntent(intent);
    }

    private void handleDeepLinkIntent(Intent intent) {
        if (intent == null || intent.getData() == null) return;
        final Uri uri = intent.getData();
        final String uriString = uri.toString();

        if (this.bridge != null && this.bridge.getWebView() != null) {
            final WebView webView = this.bridge.getWebView();
            webView.postDelayed(new Runnable() {
                @Override
                public void run() {
                    try {
                        String escapedUrl = uriString.replace("'", "\\'");
                        webView.evaluateJavascript(
                            "try { " +
                            "  window.sessionStorage.setItem('nirvighna_incoming_deep_link', '" + escapedUrl + "'); " +
                            "  if (window.handleNirvighnaDeepLink) { window.handleNirvighnaDeepLink('" + escapedUrl + "'); } " +
                            "  window.dispatchEvent(new CustomEvent('nirvighna_deep_link', { detail: { url: '" + escapedUrl + "' } })); " +
                            "} catch(e){ console.error('Deep link dispatch error:', e); }",
                            null
                        );
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }, 600);
        }
    }

    @Override
    public void onDestroy() {
        if (textToSpeech != null) {
            textToSpeech.stop();
            textToSpeech.shutdown();
        }
        super.onDestroy();
    }
}

