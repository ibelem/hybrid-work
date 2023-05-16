# Hybrid Work on the Web

Hybrid Work​ to connect, share, collaborate, and manage your work on the Web.

## Emerging Web APIs Support

- [W3C Web Neural Network API (WebNN)](https://webnn.dev/), running on the on-device hardware such as CPU, GPU or purpose-built AI accelerators like Intel VPU.
- [W3C Compute Pressure API](https://w3c.github.io/compute-pressure/)

## Setup

### Environment Configuration

Update configurations in `config.js` under main folder, paste `sampleServiceId` and `sampleServiceKey` values from WebRTC server via Docker on [Linux](doc/docker_linux.md), update them as the values of `id` and `key` in [config.js](config.js) like below:

```
{
	"id": "63f4560140a6e703e70f7b4f",
	"key": "Oj3C7oYzk1N4Te9n8p6CKiv/KxVG0tUNTIzW6OxKdq8Di4ycmjnD6uA9+vV/nyL+DpPk+LWfDaa9z8tgz2ny3NIJ6Qq26fYijgJny5luAWat2U9Y1B2IapprAgaeJDMSZU1BpfYAYP76ag4aF4CehIKUcforOhyfGUVc64AW0ns=",
	"url": "https://10.239.115.52:3000/",
	"httpsPort": 8082,
	"cert": "./cert/gwo.crt",
	"certkey": "./cert/gwo.key"
}

```

Update `meetingserver.js`:

```
cert: fs.readFileSync('cert/wic.crt'),
key: fs.readFileSync('cert/wic.key'),
```

## Developing

```bash
npm install
npm run dev
```

## Building

To create a production version of your app:

```bash
npm run build
```

Preview the production build with `npm run preview`.

> To deploy your app, install an [adapter](https://kit.svelte.dev/docs/adapters) for target environment.
