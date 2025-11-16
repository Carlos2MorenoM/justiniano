"""
Service for parsing BOE XML content into clean text.
"""
import logging
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)

def parse_legal_text(xml_content: str) -> str:
    """
    Parses the raw BOE XML content to extract clean, structured legal text.

    It targets the main <texto> tag that is a *direct child* of <documento>
    to avoid capturing cross-reference text from the <analisis> block.
    
    Args:
        xml_content: The raw XML string from the BOE API.

    Returns:
        The clean, newline-separated text, or an empty string if
        parsing fails or the main <texto> tag is not found.
    """
    try:
        # Use 'lxml-xml' parser, as it's faster and designed for XML
        soup = BeautifulSoup(xml_content, 'lxml-xml')
        
        # --- ESTA ES LA LÍNEA MÁS IMPORTANTE DEL ARCHIVO ---
        # Usamos 'documento > texto' para seleccionar solo la etiqueta <texto>
        # principal, ignorando las que están anidadas en <analisis>.
        text_element = soup.select_one('documento > texto')
        
        if not text_element:
            # If the main <texto> tag is missing, this doc is unusable.
            log.warning("No main <texto> tag found (using 'documento > texto' selector).")
            return ""

        # Find all <p> tags within the main text element.
        all_paragraphs = text_element.find_all('p')
        
        if not all_paragraphs:
            # This fallback is now much less likely to be called.
            log.warning("<texto> tag was found but contained no <p> tags. Using fallback.")
            return " ".join(text_element.get_text(strip=True).split())

        # Extract the text from each <p> tag, stripping leading/trailing whitespace
        text_lines = [p.get_text(strip=True) for p in all_paragraphs]
        
        # Filter out any lines that became empty after stripping
        non_empty_lines = [line for line in text_lines if line]
        
        # Join all lines with a newline. This preserves the document's
        # structure, which is semantically very important for an LLM.
        clean_text = "\n".join(non_empty_lines)
        
        return clean_text

    except Exception as e:
        log.error(f"An unexpected error occurred during XML parsing: {e}")
        return ""