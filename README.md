## Your Neighborhood Map

#### Building The Project
  0. You should have node and npm installed. https://nodejs.org/en/download/
  1. In the root of the neighborhood-map folder, run the following command `npm i`.
  2. After the packages are installed.
    * If you just need to build the project once, run the `gulp build` command. 
    * If you're actively developing the project, run the `gulp develop` command. This allows for the project to be rebuilt as changes are made.
    * The built project will be in the ./dist directory.
  
#### Running The Tool 
  1. If you haven't already, run the command `npm i` in the root of the neighborhood-map folder.
  2. Assuming the packages are installed, run the command `gulp serve`. The console will output a URL, navigate to this URL to access the app.
  3. For the app to proceed after it's navigated to, you'll have to either accept or deny the geolocation request from the browser.