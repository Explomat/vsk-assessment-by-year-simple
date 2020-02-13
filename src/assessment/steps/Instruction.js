import React from 'react';
import { Segment } from 'semantic-ui-react';

const Instruction = ({ text }) => {
	return (
		<Segment basic dangerouslySetInnerHTML={{ __html: text }} />
	);
}

export default Instruction;