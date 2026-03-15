"use client";

import * as React from "react";
import Map, { NavigationControl, FullscreenControl, ScaleControl, GeolocateControl } from "react-map-gl/maplibre";
import { useTheme } from "next-themes";

const MAP_STYLE_LIGHT = "https://tiles.openfreemap.org/styles/bright";
const MAP_STYLE_DARK = "https://tiles.openfreemap.org/styles/dark";

export function MapView() {
  const { theme } = useTheme();
  const [viewState, setViewState] = React.useState({
    longitude: 31.1656, // Centered near Ukraine/Europe for OSINT context
    latitude: 48.3794,
    zoom: 5,
  });

  const mapStyle = theme === "dark" ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden rounded-3xl border border-border/50 shadow-2xl">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <GeolocateControl position="top-right" />
        <ScaleControl position="bottom-left" />
      </Map>
      
      {/* Search/Filter Overlay (Placeholder) */}
      <div className="absolute top-4 left-4 z-10 w-80">
        <div className="bg-background/80 backdrop-blur-md border border-border/50 p-4 rounded-2xl shadow-xl">
          <h3 className="font-bold text-lg mb-2">Live Intelligence</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/5 p-2 rounded-lg border border-primary/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Monitoring data streams...
            </div>
            {/* Legend/Filters will go here */}
          </div>
        </div>
      </div>
    </div>
  );
}
