import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';


interface AnalyticsData {
  totalInterested: number;
  yearBreakdown: Record<string, number>; 
}


export default function EventAnalyticsPage() {
  const { eventId } = useParams();
  
  // Holds our JSON data. Starts as null.
  const [data, setData] = useState<AnalyticsData | null>(null); 
  
  // Tracks if we are currently waiting for the server. Starts as true.
  const [loading, setLoading] = useState<boolean>(true);
  
  // Holds any error messages if the server crashes. Starts as null.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    //Helper function to fetch the data
    const fetchAnalytics = async () => {
      try {
        // 1. Call the backend URL
        const response = await fetch(`http://localhost:5000/api/events/${eventId}/analytics`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        
        // 3. Convert the response into usable JSON
        const jsonData = await response.json();
        
        // 4. Save the JSON into our State variable!
        setData(jsonData); 
        
      } 
      catch (err: any) {
        setError(err.message);
      } 
      finally {
        setLoading(false); 
      }
    };

    // Trigger the helper function
    fetchAnalytics();
  }, [eventId]);

  // If the data is still fetching, show a loading message
  if (loading) {
    return <div className="p-8 text-center text-white text-xl">Loading analytics...</div>;
  }

  // If the server crashed, show the error
  if (error) {
    return <div className="p-8 text-center text-red-500 text-xl">Error: {error}</div>;
  }

  // If we have no data and no error, render nothing (safety check)
  if (!data) return null;

  // --- THE ACTUAL UI ---
  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      
      {}
      <Link to="/manager" className="text-blue-400 hover:text-blue-300 hover:underline mb-8 inline-block">
        &larr; Back to Dashboard
      </Link>
      
      <h1 className="text-4xl font-bold mb-8">Event Analytics</h1>
      
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h2 className="text-gray-400 text-lg mb-2 uppercase tracking-wide">Total Interested</h2>
          <p className="text-6xl font-bold text-purple-500">{data.totalInterested}</p>
        </div>

        {}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h2 className="text-gray-400 text-lg mb-4 uppercase tracking-wide">Batch Breakdown</h2>
          
          <ul className="space-y-3">
            {}
            {Object.entries(data.yearBreakdown).map(([batch, count]) => (
              <li key={batch} className="flex justify-between items-center border-b border-gray-700 pb-2 last:border-0">
                <span className="text-lg">{batch}</span>
                <span className="bg-purple-900 text-purple-200 font-bold px-3 py-1 rounded-full">
                  {count}
                </span>
              </li>
            ))}
          </ul>
          
        </div>
      </div>
      
    </div>
  );
}
  

