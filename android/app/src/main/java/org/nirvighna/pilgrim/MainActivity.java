package org.nirvighna.pilgrim;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Force native window and decor background to warm ivory #FAF7F2 from frame 0
        if (getWindow() != null) {
            getWindow().setFlags(
                android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                android.view.WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
            );
            if (getWindow().getDecorView() != null) {
                getWindow().getDecorView().setBackgroundColor(Color.parseColor("#FAF7F2"));
            }
        }

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.setBackgroundColor(Color.parseColor("#FAF7F2"));
            webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
            webView.setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
            
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);


            // In-app direct APK downloader & native installer (No Chrome, No Browser)
            webView.addJavascriptInterface(new Object() {
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


                                // Launch package installer directly
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
                public boolean isNativeUpdater() {
                    return true;
                }
            }, "NirvighnaNativeUpdater");
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
}

