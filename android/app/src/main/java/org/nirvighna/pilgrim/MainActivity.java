package org.nirvighna.pilgrim;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
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
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;

public class MainActivity extends BridgeActivity {

    private TextToSpeech textToSpeech;
    private static final String NOTIF_CHANNEL_ID = "nirvighna_pilgrim_alerts";
    private static final String NOTIF_CHANNEL_NAME = "Nirvighna Pilgrim Alerts";

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

        // Initialize Native Android Text-To-Speech Engine for Crystal Clear Voice
        initNativeTTS();

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.setBackgroundColor(Color.parseColor("#FAF7F2"));
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);

            // Comprehensive Native Bridge (TTS, System Notifications & 1-Tap APK Updater)
            webView.addJavascriptInterface(new Object() {

                @JavascriptInterface
                public void speakText(final String text, final String langCode) {
                    if (text == null || text.trim().isEmpty()) return;
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (textToSpeech != null) {
                                Locale targetLocale = new Locale("hi", "IN");
                                if ("gu".equalsIgnoreCase(langCode)) {
                                    targetLocale = new Locale("gu", "IN");
                                } else if ("en".equalsIgnoreCase(langCode)) {
                                    targetLocale = new Locale("en", "IN");
                                }
                                textToSpeech.setLanguage(targetLocale);
                                textToSpeech.setSpeechRate(0.95f);
                                textToSpeech.setPitch(1.0f);
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                                    textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null, "nirvighna_tts_" + System.currentTimeMillis());
                                } else {
                                    textToSpeech.speak(text, TextToSpeech.QUEUE_FLUSH, null);
                                }
                            }
                        }
                    });
                }

                @JavascriptInterface
                public void stopSpeech() {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (textToSpeech != null && textToSpeech.isSpeaking()) {
                                textToSpeech.stop();
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
                public void downloadAndInstallApk(final String apkUrl) {
                    new Thread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        Toast.makeText(MainActivity.this, "Downloading update in-app...", Toast.LENGTH_SHORT).show();
                                    }
                                });

                                File outputDir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                                if (outputDir == null) {
                                    outputDir = getCacheDir();
                                }
                                File outputFile = new File(outputDir, "Nirvighna-Pilgrim-Update.apk");
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
                                    if (responseCode == HttpURLConnection.HTTP_MOVED_TEMP 
                                            || responseCode == HttpURLConnection.HTTP_MOVED_PERM 
                                            || responseCode == 307 
                                            || responseCode == 308) {
                                        String redirectUrl = conn.getHeaderField("Location");
                                        conn.disconnect();
                                        url = new URL(redirectUrl);
                                        redirects++;
                                    } else {
                                        break;
                                    }
                                }

                                if (conn == null) throw new Exception("Unable to establish connection to update server.");

                                InputStream is = conn.getInputStream();
                                FileOutputStream fos = new FileOutputStream(outputFile);
                                byte[] buffer = new byte[8192];
                                int len;
                                while ((len = is.read(buffer)) != -1) {
                                    fos.write(buffer, 0, len);
                                }
                                fos.flush();
                                fos.close();
                                is.close();
                                conn.disconnect();

                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        installApkFile(outputFile);
                                    }
                                });

                            } catch (final Exception e) {
                                e.printStackTrace();
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        Toast.makeText(MainActivity.this, "Update download notice: " + e.getMessage(), Toast.LENGTH_LONG).show();
                                    }
                                });
                            }
                        }
                    }).start();
                }

                @JavascriptInterface
                public boolean isNativeBridge() {
                    return true;
                }
            }, "NirvighnaNativeBridge");

            // Also keep updater alias for backwards-compatibility
            webView.addJavascriptInterface(new Object() {
                @JavascriptInterface
                public void downloadAndInstallApk(final String apkUrl) {
                    // Call main updater
                    MainActivity.this.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(MainActivity.this, "Starting update...", Toast.LENGTH_SHORT).show();
                        }
                    });
                }
                @JavascriptInterface
                public boolean isNativeUpdater() {
                    return true;
                }
            }, "NirvighnaNativeUpdater");
        }
    }

    private void initNativeTTS() {
        try {
            textToSpeech = new TextToSpeech(this, new TextToSpeech.OnInitListener() {
                @Override
                public void onInit(int status) {
                    if (status == TextToSpeech.SUCCESS && textToSpeech != null) {
                        textToSpeech.setLanguage(new Locale("hi", "IN"));
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
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setColor(Color.parseColor("#800020"))
                .setContentIntent(pendingIntent);

            manager.notify((int) (System.currentTimeMillis() % 100000), builder.build());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void installApkFile(File apkFile) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!getPackageManager().canRequestPackageInstalls()) {
                    Intent permIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    permIntent.setData(Uri.parse("package:" + getPackageName()));
                    permIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(permIntent);
                    Toast.makeText(this, "Please grant permission to install updates directly.", Toast.LENGTH_LONG).show();
                    return;
                }
            }

            Uri apkUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apkFile);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, "Could not open installer: " + e.getMessage(), Toast.LENGTH_LONG).show();
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


