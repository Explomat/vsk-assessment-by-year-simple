import React from 'react';

const Item = (props) => {
	return (
		<li>
			{props.label}
			{props.children}
		</li>
	);
}

export default Item;