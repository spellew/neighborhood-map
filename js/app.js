'use strict';
const loadScriptAsync = (script) => {
  const tag = document.createElement('script');
  tag.async = false;
  tag.onload = script.onLoad;
  tag.onerror = script.onError;
  tag.src = script.src;
  document.head.appendChild(tag);
}

// This function is called in after the LeafletJS script is loaded in.
const handleLeafletLoad = () => {
  // After loading in the LeafletJS script, we'll want to load the bouncing library
  // asynchronously, because it relies on LeafletJS.
  loadScriptAsync({
    src: 'js/lib/leaflet.smoothmarkerbouncing.js',
    onLoad: handleBouncingLoad,
    onError: handleBouncingError
  });

  // First, LeafletJS is used to create a map, with an initial zoom and
  // keyboard controls disabled (I found an error with the event that deals
  // with closing popups with the ESC button).
  // Then, we make a request to the Mapbox API and add the tiles we receive as a
  // response, to our Leaflet map.
  const map = L.map('map', {
    zoom: 13,
    center: [0, 0],
    keyboard: false
  });

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoic3BlbGxldyIsImEiOiJjamNqdW5iazgzazI0MndudGh6NjVqM2xrIn0.VML7TdhGwdJlFXauBgwheQ',
  }).addTo(map);
  window.map = map;
}

// This function is called if an error occurs while the LeafletJS script is loading
// in.
const handleLeafletError = () => {
  alert("There was an error loading in the map, please try again later.");
}

// This function is called when the loading in of the bouncing library succeeds.
const handleBouncingLoad = () => {
  // After loading in the bouncing library script, we can finally load in the Places
  // API asynchronously.
  loadScriptAsync({
    src: 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDQOrqZ1s3pzisd-dwjrBep3sTguZ7rm6U&libraries=places',
    onError: handlePlacesError,
    onLoad: handlePlacesLoad
  });
}

// This function is called if an error occurs while the bouncing library is loading
// in.
const handleBouncingError = () => {
  alert('There was a problem animating the markers bouncing. They\'ll still be displayed, just static.');
  loadScriptAsync({
    src: 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDQOrqZ1s3pzisd-dwjrBep3sTguZ7rm6U&libraries=places',
    onError: handlePlacesError,
    onLoad: handlePlacesLoad
  });
}

// This function is called in after the Places API script is loaded in.
const handlePlacesLoad = () => {
  // This checks if the user's browser supports geolocation, if not an alert is
  // given and fallback locations are displayed. However if geolocation is 
  // supported, we get the user's coordinates, make a call to the Google Places
  // API (using a decoy element since we're not using the Google Maps map),
  // and we receive points of interests near the user. If there are points
  // of interest near the user, these places are displayed, if not an alert is
  // given and the fallback locations are displayed. 
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      const request = {
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        },
        radius: 5000,
        type: ['point_of_interest'],
      };
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      window.geolocatedCoordinates = position.coords;
      service.nearbySearch(request, (locations) => {
        if (locations.length) {
          displayLocations(locations);
        } else {
          alert('It seems like there are no places nearby your location. Displaying fallback...');
          displayLocations(fallbackLocations, true);
        }
      });
    }, () => {
      alert('Something seems to have gone wrong getting your location. Displaying fallback...');
      displayLocations(fallbackLocations, true);
    });
  } else {
    alert("It seems like your browser is missing the Geolocation API. Displaying fallback...");
    displayLocations(fallbackLocations, true);
  }
}

// This function is called if an error occurs while the Google Maps Places API
// is loading in.
const handlePlacesError = () => {
  alert('There was an error getting places near you. Displaying fallback...');
  displayLocations(fallbackLocations, true);
}

// This is the function that displays either the fallback locations or the
// locations received from the Place API.
const displayLocations = (locations, fallback) => {
  // The ViewModel holds the structure of our application, and defines functions
  // that control how the user interacts with the UI.
  const ViewModel = function () {
    // We're storing this in the "self" variable for later use, it'll be useful
    // for functions where this changes, and will help for readability in the code.
    const self = this;
    const map = window.map;

    // This variable will store the markers, which we'll use to visually represent the
    // locations.
    const markers = L.featureGroup();

    // The filter property will store the value of our input element, which the
    // user will use to search for locations. The locations property will store,
    // the locations we received from the API or fallback. filteredLocations will
    // store the locations too, but filtered usng the user input. isDrawerOpen will
    // hold a boolean, which we'll use in the HTML, to decide if we should show
    // the aside element or not. Markers stres
    self.filter = ko.observable("");
    self.locations = ko.observableArray(locations);
    self.filteredLocations = ko.observableArray(self.locations());
    self.isDrawerOpen = ko.observable(true);

    // This function updates the value of self.isDrawerOpen, and sets the value to
    // the opposite of it's previous value. For example, if isDrawerOpen was true,
    // it'll be set to false. Also because we're changing the size of
    // the map container, we'll invalidate the map size, so the map will resize
    //  to fill up the container.
    self.toggleDrawer = () => {
      self.isDrawerOpen(!self.isDrawerOpen());
      map.invalidateSize();
    };

    // This function will redraw the markers on the map, first it removes all the
    // markers, then for each location (that has been filtered and fits the user's
    // query) a new marker is made at that location's coordinates. These new
    // markers are being restricted so only one may bounce at a time, and are
    // added to the map. Also, if the locations weren't sent through the fallback 
    // and the location has photos, we'll get the URL of the location's first photo
    // and store it in the location object. We also store the marker in the location.
    // We then give the object a new property, focused, and we set it to false.
    // If a location isn't focused it's allowed to stop bouncing. For example,
    // if the user clicks a marker, zooms in on it, and it starts bouncing,
    // and then the user hovers over another marker, the zoomed in one,
    // won't be allowed to stop bouncing. We then bind a popup to the marker,
    // and when it's clicked the marker will be displayed. This popup contains
    // the location name and a photo of the location, if the photo exists. We also
    // bind some events to our markers. If the mouse is over the marker the marker
    // will start bouncing. If you move the mouse out of the marker, it will stop
    // bouncing. If you click on the marker, the marker will become focused,
    // zoomed in on, and the popup will be displayed. Finally, we add the
    // marker to the markers layer group, and if there are locations
    // exist that fit our query, we will zoom the map in to fit all these markers.
    self.redrawMarkers = () => {
      markers.clearLayers();
      self.filteredLocations().forEach(location => {
        const coords = location.geometry.location;
        const marker = L.marker(fallback ? [coords.lat, coords.lng] : [coords.lat(), coords.lng()])
          .setBouncingOptions({
            exclusive: true
          })
          .addTo(map);
        if (!fallback && location.photos) {
          location.photo = location.photos[0].getUrl({
            maxWidth: 200,
            maxHeight: 200
          });
        }
        location.marker = marker;
        location.focused = false;
        marker.bindPopup(L.popup({
          closeOnClick: false,
          closeOnEscapeKey: false,
        }).setContent(self.setPopupContent(location)));
        marker.on('mouseover', () => {
          self.handleMarkerMouseOver(location);
        });
        marker.on('mouseout', () => {
          self.handleMarkerMouseOut(location);
        });
        marker.on('click', () => {
          self.handleMarkerClick(location);
        });
        markers.addLayer(marker);
      });
      if (markers.getLayers().length) {
        map.fitBounds(markers.getBounds(), {
          padding: [50, 50]
        });
      }
    };

    self.setPopupContent = (location) => {
      location.photo ? `<figure>
          <img class="photo-popup" src="${location.photo}" alt="${location.name}" />
          <figcaption>${location.name}</figcaption>
        </figure>` : `<figcaption>${location.name}</figcaption>`
    }

    // This function will bounce the marker.
    self.handleMarkerMouseOver = (location) => {
      location.marker.bounce();
    };

    // This function will stop the marker from bouncing, if it isn't the marker
    // being focused in on.
    self.handleMarkerMouseOut = (location) => {
      if (!location.focused) {
        location.marker.stopBouncing();
      }
    };

    // This function will filter the markers, using the name of the marker that
    // was just clicked. As such, the map will be recoordinated. Also, the popup
    // will popup, the marker will start bouncing, the value of the "focused"
    // property will be set to true, and the window will scroll up. We also
    // add an event listener to the leaflet popup close button, so we can properly
    // react to when the popup is closed, since Leaflet's method wasn't working.
    self.handleMarkerClick = (location) => {
      const name = location.name;
      self.filter(name);
      self.filterLocations(null, null, name);
      location.marker.openPopup();
      Array.from(document.getElementsByClassName('leaflet-popup-close-button')).forEach(close => {
        close.addEventListener('click', self.resetFilter);
      });
      location.focused = true;
      location.marker.bounce();
      window.scrollTo(0, 0);
    };

    // This function can take three parameters, the view model, an event, or a
    // string. If an event is passed to the function, we take the text value of
    // the event's target, if not it means a string was passed to the function,
    // so we take that instead, and assign either to the query variable. Then we
    // filter the locations by location name, and if the query is a substring
    // of a location name, the location will be returned and will exist in our new
    // array. The map is then redrawn to display our new markers. Both location names and query are lowercased, so there's no issue comparing
    // them.
    self.filterLocations = (vm, evt, str) => {
      const query = (evt ? evt.target.value : str).toLowerCase();
      const filteredLocations = self.locations().filter(location => location.name.toLowerCase().includes(query));
      self.filteredLocations(filteredLocations);
      self.redrawMarkers();
    };

    // This changes the value of the filter to an empty string, and resets the
    // fitered locations to the locations that were originally passed to the
    // displayLocations function. The map is then redrawn to reflect this change
    // in markers.
    self.resetFilter = () => {
      self.filter("");
      self.filteredLocations(self.locations());
      self.redrawMarkers();
    };

    // We add our markers to the map, and draw any markers to initiate the display
    // of markers on the map.
    markers.addTo(map);
    self.redrawMarkers();
  }

  // We apply the bindings of our ViewModel to the DOM, so we can use the self
  // functions and variables in our HTML file.
  ko.applyBindings(new ViewModel());
};