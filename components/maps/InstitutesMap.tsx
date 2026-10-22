"use client";

import {
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
} from "@vis.gl/react-google-maps";
import { useState } from "react";
import Link from "next/link"; // Next.js ke navigation ke liye

interface Institute {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  slug: string;
}

interface Props {
  institutes: Institute[];
}

export default function InstitutesMap({ institutes }: Props) {
  const [selected, setSelected] = useState<Institute | null>(null);

  const validInstitutes = institutes.filter(
    (i) => i.latitude && i.longitude
  );

  if (!validInstitutes.length) {
    return (
      <div className="flex h-125 items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 text-gray-500">
        No locations available to map.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <Map
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
        defaultCenter={{
          lat: validInstitutes[0].latitude!,
          lng: validInstitutes[0].longitude!,
        }}
        defaultZoom={12} // Thoda zyaada zoom in default rakha hai
        gestureHandling="greedy"
        disableDefaultUI={true} // Default UI chhupane se map clean dikhta hai
        style={{
          width: "100%",
          height: "500px",
        }}
      >
        {validInstitutes.map((institute) => (
          <AdvancedMarker
            key={institute.id}
            position={{
              lat: institute.latitude!,
              lng: institute.longitude!,
            }}
            onClick={() => setSelected(institute)}
            onMouseEnter={() => setSelected(institute)}
          >
            {/* Custom styled pin */}
            <Pin
              background={"#EAB308"} // Dark premium color (Tailwind gray-900)
              borderColor={"#111827"}
              glyphColor={"#ffffff"}
              scale={1.1} // Thoda bada marker
            />
          </AdvancedMarker>
        ))}

        {selected && (
          <InfoWindow
            position={{
              lat: selected.latitude!,
              lng: selected.longitude!,
            }}
            onCloseClick={() => setSelected(null)}
            pixelOffset={[0, -35]} // Marker ke thoda upar khulne ke liye
          >
            {/* Premium Info Window Styling */}
            <div className="flex flex-col gap-2 p-1 min-w-50">
              <p className="text-base font-semibold text-gray-900 leading-tight">
                {selected.name}
              </p>

              <Link
                href={`/institute/${selected.slug ? `${selected.id}-${selected.slug}` : selected.id}`}
                className="group flex items-center gap-1 text-sm font-medium text-amber-600 transition-colors hover:text-amber-700"
              >
                View Details
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </InfoWindow>
        )}
      </Map>
    </div>
  );
}