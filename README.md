# Tiktok plugin for Grayjay
A plugin for [GrayJay](https://github.com/futo-org/grayjay-android) that supports Tiktok. This repo is currently a work-in-progress and will be updated regularly.

## About
This plugin has 2 parts:
- **Python server**: This server scrapes data from tiktok using [davidteacher/TiktokApi](https://github.com/davidteather/TikTok-Api).
- **Grayjay plugin** This plugin communicates with the python server and allows you to view tiktok on your phone.

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
