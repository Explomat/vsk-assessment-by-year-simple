import React from 'react';
import { Spin, Alert } from 'antd';

const Loader = ({ message, description }) => {
	return (
		<Spin tip={message}>
			<Alert
				description={description}
				type='info'
			/>
		</Spin>
	);
}

export default Loader;