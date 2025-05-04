import React from 'react';
import "./AvatarCircle.css"

class AvatarCircle extends React.Component {

    // default radius to the avatar
    defaultRadius = "70px";

    // constructor
    constructor(props) {
        super(props);

        this.defaultAvatar = window.location.origin + "/assets/images/example_img.jpeg";

        // get the radius and the func from the props
        const { radius = this.defaultRadius, func = null } = props;

        // define the state
        this.state = {
            selectedAvatar: props.src || this.defaultAvatar,
            setRadius: radius,
        };

        this.func = func;
    }

    // update the components in the state if they changed
    componentDidUpdate(prevProps) {
        if (prevProps.radius !== this.props.radius) {
            this.setState({
                setRadius: this.props.radius || this.defaultRadius,
            });
        }

        if (prevProps.src !== this.props.src) {
            this.setState({
                selectedAvatar: this.props.src || this.defaultAvatar,
            });
        }
    }

    render() {
        // get the avatar and the radius from the state
        const { selectedAvatar, setRadius } = this.state;

        // return the avatar
        return (
            <div
                className="avatar-container"
                style={{ width: setRadius, height: setRadius }}
                onClick={this.func || null} >
                <img
                    className="avatar-image"
                    src={selectedAvatar}
                    alt={selectedAvatar}
                />
            </div>
        );
    }
}

export default AvatarCircle;