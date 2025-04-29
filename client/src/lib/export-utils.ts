import { DateFilter } from '@shared/schema';

export async function downloadPdf(dateFilter?: DateFilter) {
  let url = '/api/reports/pdf';
  
  if (dateFilter) {
    const params = new URLSearchParams();
    params.append('startDate', dateFilter.startDate.toISOString());
    params.append('endDate', dateFilter.endDate.toISOString());
    url = `${url}?${params.toString()}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF report');
    }
    
    // Create a blob from the PDF stream
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'expense-report.pdf';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

export async function downloadExcel(dateFilter?: DateFilter) {
  let url = '/api/reports/excel';
  
  if (dateFilter) {
    const params = new URLSearchParams();
    params.append('startDate', dateFilter.startDate.toISOString());
    params.append('endDate', dateFilter.endDate.toISOString());
    url = `${url}?${params.toString()}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate Excel report');
    }
    
    // Create a blob from the Excel stream
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'expense-report.xlsx';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading Excel:', error);
    throw error;
  }
}
