import {Observable} from "rxjs";

export interface iMapLatLng {
    lat: number,
    lng: number
}

export interface iMapAddMarkerParams {
    markerTitle: string,
    position: iMapLatLng,
    color?: string
}

export interface iMapBounds {
    northEast: iMapLatLng,
    southWest: iMapLatLng
}

export interface iMapState {
    center: iMapLatLng,
    bounds?: iMapBounds,
    zoom: number
}

/**
 * Facade over map implementation api
 * Views will use this as buffer to communicate with a map api
 */
export interface iMapRender {

    isInitialized: boolean;

    loadMap(div: string): Promise<void>;

    setCenterCoordinates(position: iMapLatLng): void;

    addMarker(markerReferenceName: string, params: iMapAddMarkerParams): void;
    streamAddMarker(markerReferenceName: string, params: iMapAddMarkerParams, isLast: boolean): void;

    markerClicked$: Observable<string>;

    removeMarker(markerReferenceName: string): void;
    removeAllMarkers(): void;

    removeMap(): void;

    addMarkers(markers: Array<{
        markerReferenceName: string,
        params: iMapAddMarkerParams
    }>): void

}