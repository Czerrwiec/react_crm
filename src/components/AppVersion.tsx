import packageJson from '../../package.json';

export default function AppVersion() {
	return (
		<div className="text-center py-4">
			<p className="text-xs text-gray-400">Easy Drive v{packageJson.version}</p>
		</div>
	);
}
