export const geocodeAddress = async (address) => {
  const fetchGeo = async (query) => {
    if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
      );
      const googleData = await googleRes.json();
      if (googleData.results && googleData.results.length) {

        return { lat: loc.lat, lon: loc.lng };
      }
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    return data && data.length ? { lat: data[0].lat, lon: data[0].lon } : null;
  };

  let result = await fetchGeo(address);
  if (!result) {
    result = await fetchGeo('Hesperia WTC Valencia, Carabobo, Venezuela');
  }
  return result;
};

export default geocodeAddress;
