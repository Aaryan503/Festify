/**
 * Extracts the batch year from bits email.
 * Example: "f20231234@hyderabad..." -> "23 batch"
 */
export const getBatchFromEmail = (email: string): string => {
  if (!email) return "Unknown batch";
  
  // Regex looks for a letter at the start, two digits, and captures the next two digits
  const match = email.match(/^[a-zA-Z]\d{2}(\d{2})/); 
  
  if (match && match[1]) {
    return `${match[1]} batch`; 
  }
  return "Unknown batch";
};