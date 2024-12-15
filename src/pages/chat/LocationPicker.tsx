import mapboxgl from "mapbox-gl"
import React from "react"

interface PickerProps {
    onChange?: (coordinates: [number, number]) => void
}

const accessToken = import.meta.env.VITE_APP_MAPBOX_API_KEY

const Picker: React.FC<PickerProps> = (props) => {

    mapboxgl.accessToken = accessToken

    const {
        onChange
    } = props

    const mapRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        import('mapbox-gl/dist/mapbox-gl.css')
        let map: mapboxgl.Map | null = null
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords
            onChange && onChange([longitude, latitude])
            map = new mapboxgl.Map({
                container: mapRef.current as HTMLDivElement,
                style: 'mapbox://styles/mapbox/streets-v11',
                center: [longitude, latitude],
                zoom: 10
            })
            let marker: mapboxgl.Marker | null = null
            map.on('mouseup', () => {
                const { lng, lat } = map?.getCenter() as mapboxgl.LngLat
                if (marker !== null) {
                    marker.remove()
                    if (map) {
                        marker = new mapboxgl.Marker()
                            .setLngLat([lng, lat])
                            .addTo(map)
                    }
                }
                onChange && onChange([lng, lat])
            })
            map.on('move', () => {
                const { lng, lat } = map?.getCenter() as mapboxgl.LngLat
                // if marker is not null, remove it
                if (marker !== null) {
                    marker.remove()
                    if (map) {
                        marker = new mapboxgl.Marker()
                            .setLngLat([lng, lat])
                            .addTo(map)
                    }
                }
            })
            if (marker === null) {
                marker = new mapboxgl.Marker()
                    .setLngLat([longitude, latitude])
                    .addTo(map)
            }
        })
        return () => {
            map?.remove()
        }
    }, [])

    return (
        <div
            className={'h-[500px]'}
            ref={mapRef} />
    )
}

interface LocationPickerData {
    address: string,
    coordinates: [number, number]
}

interface LocationPickerProps {
    children?: React.ReactNode
    onClick?: (data: LocationPickerData) => void
}

interface MapboxGeoJSONFeatureProperties {
    id: string,
    type: string,
    place_type: string[],
    relevance: number,
    properties: {
        wikidata: string
    },
    text: string,
    place_name: string,
    center: [number, number],
    geometry: {
        type: string,
        coordinates: [number, number]
    },
    address: string,
    context: [
        {
            id: string,
            text: string,
            wikidata: string
        }
    ]

}

interface MapboxGeoJSONFeature {
    type: string,
    query: string[],
    features: MapboxGeoJSONFeatureProperties[]
}

const LocationPicker: React.FC<LocationPickerProps> = (props) => {

    const [search, setSearch] = React.useState<string>('')

    const [coordinates, setCoordinates] = React.useState<[number, number]>([0, 0])

    const [mapboxData, setMapboxData] = React.useState<MapboxGeoJSONFeature | null>(null)


    const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target
        setSearch(value)
        if (value.length < 3) {
            setMapboxData(null)
        }
    }

    const handleInputOnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && search.length > 2) {
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${search}.json?proximity=${coordinates}&access_token=${accessToken}`)
                .then((res) => res.json())
                .then((data) => {
                    setMapboxData(data)
                })
        }
    }

    const handleChangeCoordinates = (coordinates: [number, number]) => {
        setCoordinates(coordinates)
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates.flat()}.json?limit=1&access_token=${accessToken}`)
            .then((res) => res.json())
            .then((data) => {
                setMapboxData(data)
            })
    }
    return (
        <div
            className={'w-full relative'}>
            <div
                className={'relative w-full'}>
                <Picker
                    onChange={handleChangeCoordinates} />
            </div>
            <aside
                className={'flex flex-col gap-2 absolute top-5 left-5 right-[50%]'}>
                <div>
                    <input
                        onKeyDown={handleInputOnKeyDown}
                        value={search}
                        onChange={handleChangeInput}
                        type={'text'}
                        className={'w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:border-blue-500'}
                        placeholder={'Search'} />
                </div>
                <div
                    className={'flex flex-col gap-2 overflow-auto max-h-80 hide-scrollbar'}>
                    {
                        mapboxData?.features.map((feature) => (
                            <div
                                onClick={() => {
                                    if (props.onClick) {
                                        props.onClick({
                                            address: feature.place_name,
                                            coordinates: feature.center
                                        })
                                    }
                                }}
                                key={feature.id}
                                className={'flex flex-col gap-2 bg-white p-2 rounded-lg cursor-pointer'}>
                                <div
                                    className={'flex flex-col gap-2'}>
                                    <div
                                        className={'text-lg font-semibold'}>
                                        {feature.place_name}
                                    </div>
                                    <div
                                        className={'text-sm text-gray-500'}>
                                        {feature.context[0].text}
                                    </div>
                                </div>
                                <div
                                    className={'flex flex-col gap-2'}>
                                    <div
                                        className={'text-sm text-gray-500'}>
                                        {feature.properties.wikidata}
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </aside>
        </div>
    )
}

export { LocationPicker }