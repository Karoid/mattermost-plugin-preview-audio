# Audio Preview Plugin

이 플러그인은 Mattermost에서 오디오 파일(MP3, WAV, OGG)의 파형을 미리볼 수 있는 기능을 제공합니다.

## 소개

Audio Preview 플러그인은 Mattermost에서 오디오 파일을 업로드했을 때 파형을 시각화하여 보여주는 플러그인입니다. 
이 플러그인을 사용하면 오디오 파일의 전체적인 구조를 한눈에 파악할 수 있으며, 원하는 구간을 쉽게 탐색할 수 있습니다.

### 지원하는 파일 형식
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)

### 주요 기능
- 오디오 파형 시각화
- 구간 재생
- 대용량 파일 최적화 (점진적 로딩)
- 재생/일시정지 컨트롤

## 설치 요구사항

- Mattermost Server v6.2.1 이상

## 개발하기

플러그인을 빌드하려면:
```bash
make
```

이 명령어는 Mattermost 서버에 업로드할 수 있는 단일 플러그인 파일을 생성합니다:

```
dist/com.karoid.table-preview.tar.gz
```

## Development

To avoid having to manually install your plugin, build and deploy your plugin using one of the following options. In order for the below options to work, you must first enable plugin uploads via your config.json or API and restart Mattermost.

```json
    "PluginSettings" : {
        ...
        "EnableUploads" : true
    }
```

### Deploying with Local Mode

If your Mattermost server is running locally, you can enable [local mode](https://docs.mattermost.com/administration/mmctl-cli-tool.html#local-mode) to streamline deploying your plugin. Edit your server configuration as follows:

```json
{
    "ServiceSettings": {
        ...
        "EnableLocalMode": true,
        "LocalModeSocketLocation": "/var/tmp/mattermost_local.socket"
    },
}
```

and then deploy your plugin:
```
make deploy
```

You may also customize the Unix socket path:
```bash
export MM_LOCALSOCKETPATH=/var/tmp/alternate_local.socket
make deploy
```

If developing a plugin with a webapp, watch for changes and deploy those automatically:
```bash
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_TOKEN=j44acwd8obn78cdcx7koid4jkr
make watch
```

### Deploying with credentials

Alternatively, you can authenticate with the server's API with credentials:
```bash
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_USERNAME=admin
export MM_ADMIN_PASSWORD=password
make deploy
```

or with a [personal access token](https://docs.mattermost.com/developer/personal-access-tokens.html):
```bash
export MM_SERVICESETTINGS_SITEURL=http://localhost:8065
export MM_ADMIN_TOKEN=j44acwd8obn78cdcx7koid4jkr
make deploy
```

### Releasing new versions

The version of a plugin is determined at compile time, automatically populating a `version` field in the [plugin manifest](plugin.json):
* If the current commit matches a tag, the version will match after stripping any leading `v`, e.g. `1.3.1`.
* Otherwise, the version will combine the nearest tag with `git rev-parse --short HEAD`, e.g. `1.3.1+d06e53e1`.
* If there is no version tag, an empty version will be combined with the short hash, e.g. `0.0.0+76081421`.

To disable this behaviour, manually populate and maintain the `version` field.

## Q&A

### How do I make a server-only or web app-only plugin?

Simply delete the `server` or `webapp` folders and remove the corresponding sections from `plugin.json`. The build scripts will skip the missing portions automatically.

### How do I include assets in the plugin bundle?

Place them into the `assets` directory. To use an asset at runtime, build the path to your asset and open as a regular file:

```go
bundlePath, err := p.API.GetBundlePath()
if err != nil {
    return errors.Wrap(err, "failed to get bundle path")
}

profileImage, err := ioutil.ReadFile(filepath.Join(bundlePath, "assets", "profile_image.png"))
if err != nil {
    return errors.Wrap(err, "failed to read profile image")
}

if appErr := p.API.SetProfileImage(userID, profileImage); appErr != nil {
    return errors.Wrap(err, "failed to set profile image")
}
```

### How do I build the plugin with unminified JavaScript?
Setting the `MM_DEBUG` environment variable will invoke the debug builds. The simplist way to do this is to simply include this variable in your calls to `make` (e.g. `make dist MM_DEBUG=1`).
