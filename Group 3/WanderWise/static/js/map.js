mapboxgl.accessToken =
  "pk.eyJ1IjoicmFodWwtem9yZSIsImEiOiJjbTZxbGN4dGsxZXowMnFxODFmbHk3cHFjIn0.8iLGhsuTngzMiNCvWfqirA";

navigator.geolocation.getCurrentPosition(successLocation, errorLocation, {
  enableHighAccuracy: true,
});

function successLocation(position) {
  setupMap([position.coords.longitude, position.coords.latitude]);
}

function errorLocation() {
  setupMap([72.8777, 19.076]);
}

function setupMap(center) {
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: center,
    zoom: 12,
  });

  const nav = new mapboxgl.NavigationControl();
  map.addControl(nav);

  var directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
  });

  map.addControl(directions, "top-left");
}
