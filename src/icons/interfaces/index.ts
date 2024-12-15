
interface IconProps {
    fill?: string
    stroke?: string
}

export interface IconComponent extends React.FunctionComponent<IconProps> {
    displayName: string
}