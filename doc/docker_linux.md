# Run OWT Server, WIC Server and WIC demo on the same Linux device

## Docker Installation

Please follow the [instructions to install Docker Desktop](https://docs.docker.com/desktop/install/linux-install/).

- [Install Docker Desktop on Fedora](https://docs.docker.com/desktop/install/fedora/)
- [Install Docker Desktop on Ubuntu](https://docs.docker.com/desktop/install/ubuntu/)

If you are undering the proxy environment, please [Configure Docker to use a proxy server](https://docs.docker.com/network/proxy/)

## Intel Open WebRTC Toolkit (OWT) Server Setup in Docker

1. Download OWT images

`$ docker pull openvisualcloud/xeon-ubuntu1804-service-owt`

1. Download the [Dockerfile](Dockerfile)
2. Download patch file sdpInfo.js in https://github.com/open-webrtc-toolkit/owt-server/pull/1268/files to where [Dockerfile](Dockerfile) file locates
3. Go to folder where Dockerfile locates and run `docker build -t openvisualcloud/xeon-ubuntu1804-service-owt .`
4. Run `$ docker images` to get the [Image ID]
5. Start OWT Server in Docker

`$ docker run -itd --network=host --name=owt1 [your image ID]`

or

`$ docker run -itd -p 8080:8080 -p 3000:3000 -p 3300:3300 -p 3004:3004 -p 10000-11000:10000-11000 --name=owt1 [your image ID]`

6. Go to bash environment in Docker

`$ docker exec -it owt1 bash`

7. Update some config files

```
$ cd owt
$ sed -i "s/localhost/127\.0\.0\.1/" */*.toml
$ apt update && apt install vim
```

`$ vim portal/portal.toml` and update `hostname` value to `<your-server-ip>`

`$ vim webrtc_agent/agent.toml`, update `maxport`, `minport` to `11000` and `10000`

8. Init OWT Service

```
$ cd ..
$ ./launch.sh
```

You will get logs like:

```
MongoDB already running
Rabbitmq-server already running
Initializing ManagementAPIServer configuration...
superServiceId: 5e8422974963a115ad48b4a5
superServiceKey: so336bcIaNj4ok+WqaiYlbpNUghN8Bf/Ch+wHIB9F28IaT/zP97676LjChERzOE15qYOfrICVkffVDRbE/XqIYfdMTJKZOPuy5dWlHeIG3wGefbWoFntMecd8XrFSU9rZWUb/x6g+lnlctfYKgOK8V1QKuPS1Uk/6mzmkGwAet8=
sampleServiceId: 5df9ca6f7415937c7a91d774
sampleServiceKey: rGtTQokQM/OeG/9oDzK9TtFjd+OOeUmFN2dZl52mvaI4cSj1waduIJB8x21Wa9MaGqtZzV1KTWBvr7heBIgSjQjQyeBWI0RFzCTSyhFtd9jmZ994xE50Gkmb2zxkQYALef8oj8do3gT/cWfOfgq1zPooCkRtbMK1xm44Avduyj4=
ubuntu 18.04.4 lts
```

Please copy and paste `sampleServiceId` and `sampleServiceKey` values, which will be used in [config.js](../config.js).

Check if the server running well by accessing `https://<your-server-ip>:3004` in web browser.

### Stop or Restart the OWT Service

```
$ ./bin/start-all.sh
$ ./bin/stop-all.sh
```

### Change Video Resolution

Visit `https://<your-server-ip>:3300/console/` to change video resolution when needed

### System Reboot

If you reboot the system and the container is not running, please try:

```
$ docker start owt1
$ docker exec -it owt1 bash
$ cd owt
$ ./launch.sh
```

Go back to [README.md](../README.md)
