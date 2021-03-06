# [Wouaf IT](https://wouaf.it) [![Code Climate](https://codeclimate.com/github/WouafIT/Web_app/badges/gpa.svg)](https://codeclimate.com/github/WouafIT/Web_app)

This is the official version of the Wouaf IT web client.

How To Build
---------------------
1. First, install dependencies, by running:  
`npm install`

2. Create a file ./config/config.json with all the required data (use config.default.json for more infos)
  - Contact Wouaf IT here to ask for API keys: https://wouaf.it/contact/  
	Thank you to explain the use you intend to do with this API.  
    - It will be very well received if you want to help develop Wouaf IT (for example, coding, debugging, translating
	or help to replace the PHP part with a node one or if you want to develop a native mobile app for Wouaf IT).
    - It will be ok if you want to inject your data into Wouaf IT but you must explain which kind of data and if it is
    for commercial purpose, there may be charges.
    - It will not be ok (currently) if you want to use Wouaf IT data for another service, but feel free to ask,
   perhaps we will make an exception.
  - Use the Google console to get an API Key for Google Map.
  - Use the Facebook console to create an app and get the App key.
  - Use Google analytics to get an analytics key.
	
3. For dev build, run:  
`npm run-script dev`  
Or for production build, run:  
`npm run-script prod`

4. When you are building for development, a file ./vhost.conf will be created.  
You can include it from Apache to get all the vhost configuration done.  
This file contain a comment with the commands to create the self signed certificates to uses.

Note: It's a shame, but for now, even if all the static files are built using Node, NPM and Webpack,
the index file uses PHP to generate dynamic data served to visitors (and obviously, search engines, aka Google).
This will be changed to uses a full Node server instead but for now this is not in the top of the TODO list.
Sorry for that.

Todo
---------------------
See the project page for the TODO list : https://github.com/WouafIT/Web_app/projects/1

Bugs
---------------------
Declare all bugs on Github: https://github.com/WouafIT/Web_app/issues
Thank you to add a full reproduction method and details on the platform (browser version, mobile, etc.)

Copyright and License
---------------------
Copyright 2016 by Sébastien Pauchet

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this work except in compliance with 
the License. You may obtain a copy of the License in the LICENSE file, or at:

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed 
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for 
the specific language governing permissions and limitations under the License.