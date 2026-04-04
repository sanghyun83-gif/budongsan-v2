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
          panTo: (latLng: unknown) => void;
          setLevel: (level: number) => void;
          setBounds: (bounds: unknown) => void;
          getLevel: () => number;
          getBounds: () => {
            getSouthWest: () => { getLat: () => number; getLng: () => number };
            getNorthEast: () => { getLat: () => number; getLng: () => number };
          };
        };
        LatLngBounds: new () => {
          extend: (latLng: unknown) => void;
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
