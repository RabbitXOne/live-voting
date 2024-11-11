import React, { useState } from 'react';

const colorMap = {
    red: {
        base: '#D60000',
        dark: '#B70E0E',
        darker: '#920E0E',
        background: '#4C0101',
        backgroundDark: '#370000'
    },
    orange: {
        base: '#D37200',
        dark: '#A05600',
        darker: '#804500',
        background: '#4C2901',
        backgroundDark: '#311B00'
    },
    yellow: {
        base: '#F4CD00',
        dark: '#2D8C00',
        darker: '#A78C00',
        background: '#423800',
        backgroundDark: '#2C2500'
    },
    green: {
        base: '#36A800',
        dark: '#2D8C00',
        darker: '#206400',
        background: '#113600',
        backgroundDark: '#0D2A00'
    },
    teal: {
        base: '#00D4C9',
        dark: '#00B4AB',
        darker: '#00867F',
        background: '#003633',
        backgroundDark: '#002B28'
    },
    blue: {
        base: '#0073C4',
        dark: '#005EA1',
        darker: '#004677',
        background: '#002036',
        backgroundDark: '#00192C'
    },
    purple: {
        base: '#8D00BC',
        dark: '#75009C',
        darker: '#590077',
        background: '#320043',
        backgroundDark: '#20002C'
    },
    pink: {
        base: '#D00064',
        dark: '#BC005A',
        darker: '#A2004E',
        background: '#3E001E',
        backgroundDark: '#2E0016'
    },
    darkGray: {
        base: '#5F5F5F',
        dark: '#4A4A4A',
        darker: '#363636',
        background: '#1E1E1E',
        backgroundDark: '#171616'
    },
    lightGray: {
        base: '#A3A3A3',
        dark: '#7F7F7F',
        darker: '#686868',
        background: '#1E1E1E',
        backgroundDark: '#181818'
    }
};

const VoteButton = ({ color, letter, subtext, children, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    if(!colorMap[color]) {
        return <div>Invalid color</div>;
    }

    const styles = {
        button: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '300px',
            height: '50px',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            outline: 'none',
            userSelect: 'none',
            padding: 0,
            marginBottom: '5px',
            backgroundColor: isHovered ? colorMap[color].backgroundDark : colorMap[color].background,
            transition: 'background-color 0.15s ease-out',
        },
        left: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '50px',
            height: '50px',
            borderTopLeftRadius: '10px',
            borderBottomLeftRadius: '10px',
            color: 'white',
            fontSize: '24px',
            backgroundColor: isHovered ? colorMap[color].dark : colorMap[color].base,
            transition: 'background-color 0.15s ease-out',
        },
        right: {
            boxSizing: 'border-box',
            width: '250px',
            flex: 1,
            display: 'flex',
            // justifyContent: 'left',
            // alignItems: 'center',
            height: '50px',
            padding: 0,
            paddingLeft: '6px',
            borderTopRightRadius: '10px',
            borderBottomRightRadius: '10px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            flexDirection: 'column',
            justifyContent: 'center',
            borderTop: `2px solid ${isHovered ? colorMap[color].dark : colorMap[color].base}`,
            borderBottom: `2px solid ${isHovered ? colorMap[color].dark : colorMap[color].base}`,
            borderRight: `2px solid ${isHovered ? colorMap[color].dark : colorMap[color].base}`,
            backgroundColor: isHovered ? colorMap[color].backgroundDark : colorMap[color].background,
            transition: 'all 0.15s ease-out',
            lineHeight: '0.5rem',
            textAlign: 'left',
        },
        subtext: {
            fontSize: '12px',
            color: '#999',
            // marginTop: '0.25rem',
            fontWeight: 'lighter',
            textAlign: 'left',
            marginLeft: '0.5rem',
        }
    };
    
    return (
        <button
            style={styles.button}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <div style={styles.left}>{letter}</div>
            <div style={styles.right}>
                <span style={{paddingLeft: '0.5rem'}}>{children}</span>
                {subtext && <span style={styles.subtext}><br />{subtext}</span>}
            </div>
        </button>
    );

}


export default VoteButton;