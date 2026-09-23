package com.quizmanna.app;

import android.os.Bundle;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private long backPressedTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().evaluateJavascript(
                        "(function() { return !!(window.__quizMannaHandleBack && window.__quizMannaHandleBack()); })();",
                        value -> {
                            // "true" means web app handled back navigation internally
                            // "false" means user was already on root screen
                            if ("false".equals(value) || value == null) {
                                runOnUiThread(() -> {
                                    if (backPressedTime + 2000 > System.currentTimeMillis()) {
                                        finish();
                                    } else {
                                        Toast.makeText(MainActivity.this, "Press back again to exit", Toast.LENGTH_SHORT).show();
                                        backPressedTime = System.currentTimeMillis();
                                    }
                                });
                            }
                        }
                    );
                } else {
                    finish();
                }
            }
        });
    }
}
