function Icon({ className = "", icon, color = "white", padding = "5pt", border = false, style = {}, onClick = null }) {
    return (
        <span
            className={`icon ${className}`}
            style={{
                color,
                padding,
                outline: border ? `1px solid ${color}` : 'none',
                cursor: onClick ? 'pointer' : 'inherit',
                ...style
            }}
            onClick={onClick}
        >
            {icon}
        </span>
    );
}

export default Icon;
