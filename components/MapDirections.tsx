'use client';

import { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface MapDirectionsProps {
  origin: string | google.maps.LatLngLiteral;
  destination: string | google.maps.LatLngLiteral;
  waypoints?: google.maps.LatLngLiteral[];
}

export default function MapDirections({ origin, destination, waypoints = [] }: MapDirectionsProps) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');

  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(
      new routesLibrary.DirectionsRenderer({
        map,
        polylineOptions: {
          strokeColor: '#babbf1',
          strokeWeight: 6,
          strokeOpacity: 0.9,
        },
      })
    );
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !origin || !destination) return;

    const formattedWaypoints = waypoints.map(wp => ({
      location: wp,
      stopover: true
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints: formattedWaypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          directionsRenderer.setDirections(response);
        }
      }
    );

    return () => {
      directionsRenderer.setMap(null);
    };
  }, [directionsService, directionsRenderer, origin, destination, waypoints]);

  return null;
}
