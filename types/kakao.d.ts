declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => unknown;
        Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
          setCenter: (latLng: unknown) => void;
        };
        Marker: new (options: { map: unknown; position: unknown; title?: string }) => unknown;
      };
    };
  }
}

export {};

