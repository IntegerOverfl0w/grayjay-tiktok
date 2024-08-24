# Tiktok plugin for Grayjay
A plugin for [GrayJay](https://github.com/futo-org/grayjay-android) that supports Tiktok. This repo is currently a work-in-progress and will be updated regularly.

## About
This plugin has 2 parts:
- **Python server**: This server scrapes data from tiktok using [davidteacher/TiktokApi](https://github.com/davidteather/TikTok-Api).
- **Grayjay plugin** This plugin communicates with the python server and allows you to view tiktok on your phone.

Current features:
- search tiktok users
- view comments
- view likes
- watch user videos

Missing features:
- general search (not just users)
- comment replies
- user subscriptions (coming soon)

## Preview

https://github.com/user-attachments/assets/979af6b5-9b79-40eb-857e-4dbe3e60191b

### Server setup
```console
# First clone the repo
git clone https://github.com/IntegerOverfl0w/grayjay-tiktok

# Then Setup the python virtual environment using the setup.sh script
sh script.sh && source tt_env/bin/activate

# open up tiktok.com in a browser, click the search bar and search for a user then copy the ms_token cookie from the browser 
# in chrome: right click + Inspect -> Go to the "Application" tab (may be hidden under ">>") ->
# ... Click on Local Storage -> https://www.tiktok.com -> copy the msToken value

# Make sure to open up secrets.py after running this command and paste your MSTOKEN value
cp secrets.sample.py secrets.py

# ..and then run the server
python server.py
```

### Install plugin
![qr-code](./qr-code.png)

[Click to Install](grayjay://plugin/https://integeroverfl0w.github.io/grayjay-tiktok/TiktokConfig.json)

<grayjay://plugin/https://integeroverfl0w.github.io/grayjay-tiktok/TiktokConfig.json>

### TODO
- CAPTCHA support
- Obtain direct video url instead of streaming
- Reverse engineer signing algorithm and perform it directly in the plugin without having a separate python server.
- Have a config option for the python server address (need to make a PR to grayjay core as there is no string support, only boolean and dropdown support)
