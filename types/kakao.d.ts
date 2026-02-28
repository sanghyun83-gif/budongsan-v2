declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => {
          getLat: () => number;
          getLng: () => number;
        };
        Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
          setCenter: (latLng: unknown) => void;
          getBounds: () => {
            getSouthWest: () => { getLat: () => number; getLng: () => number };
            getNorthEast: () => { getLat: () => number; getLng: () => number };
          };
        };
        Marker: new (options: { map: unknown; position: unknown; title?: string }) => {
          setMap: (map: unknown | null) => void;
        };
        event: {
          addListener: (target: unknown, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

export {};
