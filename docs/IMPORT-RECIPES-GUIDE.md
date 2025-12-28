# Import Recipes Feature Guide

## Overview
The Import Recipes feature allows you to bulk-import multiple meal recipes into your Meal Library using JSON, DOCX, or PDF files. This is perfect for:
- Adding your entire recipe collection at once
- Sharing recipes with other users
- Backing up and restoring your favorite meals
- Importing recipes from external sources
- Converting existing recipe documents into app format

## How to Use

### Option 1: Upload JSON File
1. Navigate to the **Meal Library** tab
2. Click the **📥 Import Recipes** button
3. Select **Upload JSON File**
4. Choose your `.json` file from your device
5. Click **Load Recipes**
6. Preview the recipes that will be imported
7. Click **Import All Recipes** to add them to your library

### Option 2: Upload DOCX/PDF Document
1. Navigate to the **Meal Library** tab
2. Click the **📥 Import Recipes** button
3. Select **DOCX/PDF**
4. Choose your `.docx` or `.pdf` file from your device
5. Click **Parse Document**
6. Wait while the document is processed (may take a few moments)
7. Preview the parsed recipes
8. Click **Import All Recipes** to add them to your library

### Option 3: Paste JSON Text
1. Navigate to the **Meal Library** tab
2. Click the **📥 Import Recipes** button
3. Select **Paste JSON**
4. Paste your JSON recipe data into the text area
5. Click **Load Recipes**
6. Preview the recipes that will be imported
7. Click **Import All Recipes** to add them to your library

## JSON Format Requirements

Your JSON file must be an **array** of recipe objects. Each recipe object must include:

### Required Fields:
- `name` (string) - Recipe name
- `type` (string) - Must be one of: "Breakfast", "Lunch", "Dinner", or "Snack"
- `protein` (number) - Protein in grams
- `calories` (number) - Total calories
- `carbs` (number) - Carbohydrates in grams
- `fats` (number) - Fats in grams
- `ingredients` (string) - Ingredient list

### Optional Fields:
- `favorite` (boolean) - Mark as favorite (defaults to `false`)

## Example JSON

```json
[
  {
    "name": "Grilled Salmon",
    "type": "Dinner",
    "protein": 42,
    "calories": 480,
    "carbs": 35,
    "fats": 18,
    "ingredients": "6oz salmon, quinoa, asparagus, lemon",
    "favorite": false
  },
  {
    "name": "Protein Smoothie",
    "type": "Snack",
    "protein": 30,
    "calories": 200,
    "carbs": 8,
    "fats": 4,
    "ingredients": "1 scoop whey protein, almond milk, berries",
    "favorite": true
  }
]
```

## DOCX/PDF Format Requirements

Documents should follow this structured format for each recipe:

```
RECIPE: Grilled Salmon
Type: Dinner
Protein: 42g
Calories: 480
Carbs: 35g
Fats: 18g
Ingredients: 6oz salmon, quinoa, asparagus, lemon

RECIPE: Protein Smoothie
Type: Snack
Protein: 30g
Calories: 200
Carbs: 8g
Fats: 4g
Ingredients: protein powder, almond milk, berries
```

### Document Formatting Rules:
- Each recipe **must start** with `RECIPE:` followed by the recipe name
- Use exact labels: `Type:`, `Protein:`, `Calories:`, `Carbs:`, `Fats:`, `Ingredients:`
- Labels are case-insensitive (`type:` or `Type:` both work)
- Numbers can include "g" or not (`42g` or `42` both work)
- Separate recipes with blank lines for clarity (optional but recommended)
- Order of fields doesn't matter (except recipe name must be first)
- Type must be one of: **Breakfast**, **Lunch**, **Dinner**, or **Snack**

### What Gets Extracted:
The parser uses pattern matching to extract:
- **Name**: First line after "RECIPE:"
- **Type**: Text after "Type:" label
- **Protein**: Numbers after "Protein:" label
- **Calories**: Numbers after "Calories:" label
- **Carbs**: Numbers after "Carbs:" label
- **Fats**: Numbers after "Fats:" label
- **Ingredients**: Text after "Ingredients:" label

## Sample Files

**sample-recipes.json** - 15 pre-made recipes in JSON format ready to import

**sample-recipes-template.txt** - Template for creating DOCX/PDF files with 10 example recipes formatted correctly. Copy this into Microsoft Word and save as .docx or export as .pdf.

## Validation

The import feature includes automatic validation that checks for:
- Missing required fields
- Invalid meal types
- Proper JSON formatting
- Array structure

If validation fails, you'll receive an error message explaining what needs to be fixed.

## Tips

1. **Test with Sample File**: Use the included `sample-recipes.json` to test the feature first
2. **Export Existing Meals**: Use the Export Data feature in Settings to create a backup of your current meals in the correct format
3. **Build Your Library**: Create a master JSON file with all your go-to recipes for easy sharing across devices
4. **Share with Friends**: Export your meal library and share the JSON file with others using the app

## Troubleshooting

### JSON Import Issues

**"Invalid JSON format" error:**
- Check that your JSON is properly formatted
- Use a JSON validator tool online to verify syntax
- Make sure you're using double quotes, not single quotes
- Ensure all commas and brackets are properly placed

**"Validation errors found" error:**
- Check the browser console for detailed error messages
- Verify all required fields are present in each recipe
- Ensure meal types match exactly: "Breakfast", "Lunch", "Dinner", or "Snack"
- Confirm numeric fields (protein, calories, etc.) are numbers, not strings

### DOCX/PDF Import Issues

**"No recipes found in document" error:**
- Ensure each recipe starts with "RECIPE:" marker
- Check that labels (Type:, Protein:, etc.) are spelled correctly
- Verify you have at least the required fields: name, type, and ingredients
- Make sure there's a space after the colon in labels (e.g., "Type: Dinner" not "Type:Dinner")

**"Error parsing document" error:**
- Try re-saving the DOCX file (sometimes fixes corruption)
- For PDFs, ensure text is selectable (not scanned images)
- Check that the file isn't password protected
- Try refreshing the page if libraries failed to load

**Recipes missing fields after parsing:**
- Numbers must be present (0 is valid if you don't track that macro)
- Check that each label is on its own line
- Ensure labels match exactly: Type, Protein, Calories, Carbs, Fats, Ingredients
- The parser looks for patterns - extra spaces or line breaks might confuse it

**Only some recipes imported:**
- Check the browser console for warnings about skipped recipes
- Each recipe needs at minimum: name, type, and ingredients
- Invalid type values will cause recipe to be skipped
- Recipes with formatting errors are logged to console

### General Issues

**No recipes showing after import:**
- Make sure you clicked "Import All Recipes" after preview
- Navigate away and back to the Meal Library tab to refresh
- Check if recipes were added to the bottom of your library

**Libraries not loading:**
- Refresh the browser page
- Check your internet connection (libraries load from CDN)
- Clear browser cache and reload

## Offline Compatibility

**JSON Import**: Works completely offline
- No internet connection required
- All processing happens in your browser
- Data stays on your device

**DOCX/PDF Import**: Requires initial library load
- Document parsing libraries (mammoth.js and PDF.js) load from CDN on first page load
- After libraries are cached, parsing works offline
- All document processing happens in your browser
- No data is sent to external servers
- Perfect for Capacitor mobile app packaging (libraries can be bundled locally)

Note: For production Capacitor apps, the DOCX/PDF parsing libraries should be bundled locally instead of loaded from CDN to ensure full offline functionality.
