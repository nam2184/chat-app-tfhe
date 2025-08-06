import { IconComponent } from "./interfaces"

const ImageOutlined: IconComponent = (props) => {

    const {
        fill = 'none',
        stroke = 'currentColor',
    } = props

    return (
        <svg xmlns="http://www.w3.org/2000/svg"
            fill={fill}
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke={stroke}
            className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a3 3 0 003 3h12a3 3 0 003-3V8.25m-18 0A3 3 0 016 5.25h1.172a1.5 1.5 0 001.06-.44L9.94 3.1A1.5 1.5 0 0111 2.75h2a1.5 1.5 0 011.06.35l1.707 1.707a1.5 1.5 0 001.06.44H18a3 3 0 013 3m-18 0h18M12 9.75a4.5 4.5 0 110 9 4.5 4.5 0 010-9zm0 0v.008h.008V9.75H12z" />
        </svg>
    )
}

ImageOutlined.displayName = "ImageOutlined"

export { ImageOutlined }

