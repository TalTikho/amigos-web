import React, {useState} from 'react';
import Signup from './Signup';
import Login from './Login';
import ThemeSwitcher from "../components/ui/ThemeSwitcher";
import "../style/RegisterContainer.css"

const RegisterContainer = () => {

    const [isLogin, setIsLogin] = useState(true);

    const toggleForm = () => setIsLogin(!isLogin);

    return(
        <div className="back">
            <h1 className="regTitle">Welcome to Amigos</h1>
            <div className="theme-switcher-container">
                <ThemeSwitcher/>
            </div>
            <div className="register-container cfb">
                <div className={`banner-side cfb ${isLogin ? '' : 'send-right'}`}>
                    <h2>{isLogin ? 'Welcome Back' : 'Hello, New Friend!'}</h2>
                    <button onClick={toggleForm}>
                        {isLogin ? 'Create Account' : 'Log In'}
                    </button>
                </div>

                <div className={`form-side cfb ${isLogin ? '' : 'send-left'}`}>
                    {isLogin ? <Login/> : <Signup/>}
                </div>

            </div>
        </div>

    )

}

export default RegisterContainer;