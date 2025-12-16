import { supabase } from '../../supabaseClient';

// Facebook Pixel Events Constants
// Facebook Pixel Events Constants
export const FACEBOOK_EVENTS = {
  VIEW_CONTENT: 'ViewContent',
  ADD_TO_CART: 'AddToCart',
  INITIATE_CHECKOUT: 'InitiateCheckout',
  PURCHASE: 'Purchase',
  LEAD: 'Lead',
  SEARCH: 'Search'
};

/**
 * Get Facebook Pixel by event ID

 * @returns {Promise<object|null>} - Pixel data or null
 */
export const getFacebookPixelByEvent = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('facebook_pixels')
      .select('*')
      .eq('evento', eventId)
      .eq('is_active', true)
      .single();

    // Handle "no rows returned" error gracefully
    if (error && error.code !== 'PGRST116') throw error;

    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Create or update Facebook Pixel
 * @param {object} pixelData - Pixel data
 * @returns {Promise<object>} - Created/updated pixel
 */
export const saveFacebookPixel = async (pixelData) => {
  try {
    const { data, error } = await supabase
      .from('facebook_pixels')
      .upsert(pixelData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Failed to save Facebook Pixel: ${error.message}`);
  }
};

/**
 * Delete Facebook Pixel by ID
 * @param {string} pixelId - Pixel ID
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFacebookPixel = async (pixelId) => {
  try {
    const { error } = await supabase
      .from('facebook_pixels')
      .delete()
      .eq('id', pixelId);

    if (error) throw error;
    return true;
  } catch (error) {
    throw new Error(`Failed to delete Facebook Pixel: ${error.message}`);
  }
};

/**
 * Get all Facebook Pixels with event data
 * @returns {Promise<Array>} - Array of pixels
 */
export const getAllFacebookPixels = async () => {
  try {
    const { data, error } = await supabase
      .from('facebook_pixels')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return [];
  }
};

/**
 * Check if pixel should track on specific page
 * @param {object} pixel - Pixel data
 * @param {string} pageName - Page name to check
 * @returns {boolean} - Should track or not
 */
export const shouldTrackOnPage = (pixel, pageName) => {
  if (!pixel || !pixel.tracking_pages) return false;

  try {
    const trackingPages = typeof pixel.tracking_pages === 'string'
      ? JSON.parse(pixel.tracking_pages)
      : pixel.tracking_pages;

    return !!trackingPages[pageName];
  } catch {
    return false;
  }
};

/**
 * Get active pixels for tracking
 * @returns {Promise<Array>} - Active pixels
 */
export const getActiveFacebookPixels = async () => {
  try {
    const { data, error } = await supabase
      .from('facebook_pixels')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
};

/**
 * Validate Facebook Pixel ID format
 * @param {string} pixelId - Facebook Pixel ID
 * @returns {boolean} - Is valid
 */
export const isValidPixelId = (pixelId) => {
  if (!pixelId) return false;
  // Facebook Pixel IDs are numeric, usually 15-16 digits
  return /^\d{15,16}$/.test(pixelId);
};

/**
 * Get pixel script for injection
 * @param {object} pixel - Pixel data
 * @returns {string} - Script HTML
 */
export const getPixelScript = (pixel) => {
  if (!pixel || !pixel.pixel_id) return '';

  const pixelId = pixel.pixel_id;

  return `
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s) {
  if(f.fbq)return;
  n=f.fbq=function() {
    n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)
  };
  if(!f._fbq)f._fbq=n;
  n.push=n;
  n.loaded=true;
  n.version='2.0';
  n.queue=[];
  t=b.createElement(e);
  t.async=true;
  t.src=v;
  s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s);
}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript>
  <img height='1' width='1' style='display:none'
  src='https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1'/>
</noscript>
<!-- End Facebook Pixel Code -->
  `.trim();
};

/**
 * Track custom Facebook event
 * @param {string} eventName - Event name
 * @param {object} parameters - Event parameters
 */
export const trackCustomEvent = (eventName, parameters = {}) => {
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', eventName, parameters);
  }
};