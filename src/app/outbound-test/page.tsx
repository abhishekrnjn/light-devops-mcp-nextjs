import OutboundAppsDropdown from '@/components/outbound/OutboundAppsDropdown';

export default function OutboundTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Outbound Apps Test
          </h1>
          <p className="text-gray-600">
            Test the outbound apps dropdown with GitLab connection.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Outbound Apps Dropdown
          </h2>
          
          <div className="flex items-center space-x-4">
            <OutboundAppsDropdown />
            
            <div className="text-sm text-gray-500">
              Click the dropdown to see available apps and connect to GitLab
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Setup Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
            <li>Create a <code className="bg-blue-100 px-1 rounded">.env.local</code> file in your project root</li>
            <li>Add your Descope project ID: <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_DESCOPE_PROJECT_ID=your_project_id</code></li>
            <li>In Descope Console, create a flow named "step-up"</li>
            <li>Configure GitLab OAuth provider in the flow</li>
            <li>Publish the flow and make it active</li>
            <li>Click the "Outbound Apps" dropdown above and then "Connect" on GitLab</li>
          </ol>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Features:</h3>
          <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
            <li>Clean dropdown interface with only GitLab app</li>
            <li>Connection status tracking (Connected/Not Connected)</li>
            <li>Modal popup with Descope step-up flow</li>
            <li>Project ID display from environment variables</li>
            <li>Success/error handling with console logging</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

