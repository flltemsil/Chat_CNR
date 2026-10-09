export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  city?: string;
  district?: string;
  country?: string;
  formattedAddress?: string;
  mapsUrl: string;
  embedUrl: string;
  timestamp: number;
}

class LocationService {
  private cachedLocation: UserLocation | null = null;
  private isLocating: boolean = false;

  /**
   * Retrieves the user's current GPS location via the Browser Geolocation API.
   * Performs reverse-geocoding to determine address/city/district.
   */
  async getCurrentLocation(forceRefresh: boolean = false): Promise<UserLocation> {
    if (!forceRefresh && this.cachedLocation && Date.now() - this.cachedLocation.timestamp < 300000) {
      return this.cachedLocation;
    }

    if (!navigator.geolocation) {
      throw new Error("Tarayıcınız coğrafi konum (Geolocation) desteği sunmuyor.");
    }

    this.isLocating = true;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => {
            let msg = "Konum alınamadı.";
            if (err.code === err.PERMISSION_DENIED) {
              msg = "Konum izni verilmedi. Lütfen tarayıcı ayarlarından konum erişimine izin verin.";
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              msg = "Konum bilgisi şu anda mevcut değil.";
            } else if (err.code === err.TIMEOUT) {
              msg = "Konum alma isteği zaman aşımına uğradı.";
            }
            reject(new Error(msg));
          },
          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 60000,
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.007}%2C${longitude + 0.01}%2C${latitude + 0.007}&layer=mapnik&marker=${latitude}%2C${longitude}`;

      let district: string | undefined;
      let city: string | undefined;
      let country: string | undefined;
      let formattedAddress: string | undefined;

      // Reverse geocoding using OpenStreetMap Nominatim API
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              "Accept-Language": "tr,en",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const addr = data.address || {};
          district = addr.suburb || addr.neighbourhood || addr.quarter || addr.district || addr.town || addr.county;
          city = addr.city || addr.province || addr.state;
          country = addr.country;

          const parts = [district, city, country].filter(Boolean);
          formattedAddress = parts.length > 0 ? parts.join(", ") : data.display_name;
        }
      } catch (e) {
        console.warn("Reverse geocode warning:", e);
      }

      const result: UserLocation = {
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        accuracy: Math.round(accuracy),
        district,
        city,
        country,
        formattedAddress: formattedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        mapsUrl,
        embedUrl,
        timestamp: Date.now(),
      };

      this.cachedLocation = result;
      return result;
    } finally {
      this.isLocating = false;
    }
  }

  getCachedLocation(): UserLocation | null {
    return this.cachedLocation;
  }

  clearLocation() {
    this.cachedLocation = null;
  }

  getIsLocating(): boolean {
    return this.isLocating;
  }
}

export const locationService = new LocationService();
