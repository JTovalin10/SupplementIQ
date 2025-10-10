{
  "targets": [
    {
      "target_name": "daily_update_service",
      "sources": [
        "DailyUpdateService.cpp",
        "binding.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "MACOSX_DEPLOYMENT_TARGET": "10.7",
            "OTHER_CPPFLAGS": ["-std=c++17"]
          }
        }],
        ["OS=='linux'", {
          "cflags": ["-std=c++17"],
          "cflags_cc": ["-std=c++17"]
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": "1",
              "AdditionalOptions": ["/std:c++17"]
            }
          }
        }]
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ]
    }
  ]
}
