import {BehaviorSubject, Subject} from "rxjs";
import {BaseView} from "../baseView";
import {iMapAddMarkerParams, iMapLatLng, iMapRender, iMapState} from "../../models/iMapRender";
import {HtmlString} from "../../models/iView";
import {DISPATCHER_MESSAGES} from "../../../dispatcher/dispatcher.messages";
import {LOG_LEVEL} from "../../../logger/models/iLog";

/**
 * Provides common functionality for map operations
 */
export abstract class BaseMapRender extends BaseView implements iMapRender {

    protected mapState: iMapState;

    private _mapObj: any = null;
    protected divId: string;
    protected markerClicked: Subject<string> = new Subject<string>();

    static readonly isMapView = true;

    protected markers: { [key: string]: any } = {};


    get isInitialized(): boolean {
        return !!this._mapObj;
    }
    
    private dispatchMapState(): void {
        this.modules.dispatcher.dispatch(DISPATCHER_MESSAGES.UpdateMapState,this.mapState);
    }

    protected doInit(): HtmlString {
        this.divId = this.getUniqueId();
        return `
            <div id="${this.divId}"></div>
        `;
    }

    protected get mapObj() {
        return this._mapObj;
    }

    get markerClicked$() {
        return this.markerClicked.asObservable();
    }

    async loadMap(): Promise<void> {
        const newDiv = document.getElementById(this.divId)!;
        newDiv.style.width = "100%";
        newDiv.style.height = "100%";

        this.mapState = this.modules.store.state.mapState;
        try {
            this._mapObj = await this.doLoadMap(newDiv.id);
            this.initCallbackListeners();
            this.modules.dispatcher.dispatch(DISPATCHER_MESSAGES.NewLog,{
                level: LOG_LEVEL.Debug,
                message: "Created map obj "+this.constructor.name
            });
        } catch (err) {
            this.modules.dispatcher.dispatch(DISPATCHER_MESSAGES.NewLog,{
                level: LOG_LEVEL.Error,
                message: "Error creating map obj "+this.constructor.name,
                data: err
            });
            throw err;
        }
    }

    addMarker(markerReferenceName: string, params: iMapAddMarkerParams): void {
        this.addMarkerHelper(markerReferenceName,params);
        this.refreshMapState();
    }

    streamAddMarker(markerReferenceName: string, params: iMapAddMarkerParams, isLast: boolean): void {
        this.addMarkerHelper(markerReferenceName,params);
        if (isLast) {
            this.refreshMapState();
        }
    }

    addMarkers(markers: Array<{
        markerReferenceName: string,
        params: iMapAddMarkerParams
    }>): void {
        markers.forEach(marker => {
            this.addMarkerHelper(marker.markerReferenceName,marker.params)
        });
        this.refreshMapState();
    }

    private addMarkerHelper(markerReferenceName: string, params: iMapAddMarkerParams): void {
        this.markers[markerReferenceName] = this.doAddMarker(markerReferenceName,params);
    }

    removeMarker(markerReferenceName: string): void {
        this.removeMarkerHelper(markerReferenceName);
        this.refreshMapState();
    }

    removeAllMarkers(): void {
        Object.keys(this.markers).forEach(name => {
            this.removeMarkerHelper(name);
        });
        this.refreshMapState();
    }

    private removeMarkerHelper(markerReferenceName: string): void {
        if (!this.markers[markerReferenceName]) {
            return;
        }

        this.doRemoveMarker(this.markers[markerReferenceName]);
        this.markers[markerReferenceName] = null;
    }

    removeMap(): void {
        this.removeAllMarkers();
        this.doRemoveMap();
        this._mapObj = null;

        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }

    setCenterCoordinates(position: iMapLatLng): void {
        this.mapState.center = position;
        this.doSetCenterCoordinates(position);
        this.refreshMapState();
        this.dispatchMapState();
    }

    setZoom(zoom: number): void {
        this.mapState.zoom = zoom;
        this.doSetZoom(zoom);
        this.refreshMapState();
        this.dispatchMapState();
    }

    protected doDestroySelf(): void {
        this.removeMap();
    }

    protected onPlacedInDocument(): void {
    }

    protected abstract initCallbackListeners(): void;

    protected abstract doSetCenterCoordinates(position: iMapLatLng): void;

    protected abstract doLoadMap(divId: string): Promise<any>;

    protected abstract doAddMarker(markerReferenceName: string, params: iMapAddMarkerParams): any;

    protected abstract doRemoveMarker(markerObj: any): void;

    protected abstract doRemoveMap(): void;

    protected abstract refreshMapState(): void;

    protected abstract doSetZoom(zoom: number): void;

}
