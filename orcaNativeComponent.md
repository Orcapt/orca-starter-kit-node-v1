# Orca Native Components

## Image Components

Orca provides native components for handling images in AI agent conversations. These components enable seamless image generation, loading states, and display within the Orca interface.

### `orca.loading.image`

The `orca.loading.image` component is used to indicate when an image is being generated or processed. This creates a loading state that provides visual feedback to users while image generation is in progress.

#### Usage

```javascript
// Start loading indicator
await orcaHandler.streamChunk(data, "[orca.loading.image.start]");

// Perform image generation (e.g., with DALL-E)
const imageUrl = await generateImageWithDALLE(
  args.prompt,
  data.variables,
  args.size || "1024x1024",
  args.quality || "standard",
  args.style || "vivid"
);

// End loading indicator
await orcaHandler.streamChunk(data, "[orca.loading.image.end]");
```

#### When to Use

- **Image Generation**: When calling AI image generation services like DALL-E, Midjourney, or Stable Diffusion
- **Image Processing**: When applying filters, resizing, or other transformations to images
- **Image Upload**: When uploading and processing user-provided images
- **Any Image Operation**: Any operation that takes time and involves images

#### Benefits

- **User Experience**: Provides clear visual feedback that something is happening
- **Expectation Management**: Users understand that image generation takes time
- **Professional Feel**: Creates a polished, responsive interface experience

### `orca.image`

The `orca.image` component is used to display images within the conversation interface. It wraps image URLs with special markdown tags that Orca recognizes and renders appropriately.

#### Usage

```javascript
// Wrap image URL with orca.image tags
const imageResult = `Image URL: [orca.image.start]${imageUrl}[orca.image.end]`;

// Or include in a more detailed response
const imageResult = `
🎨 **Image Generated Successfully!**

**Prompt:** ${args.prompt}
**Image URL:** [orca.image.start]${imageUrl}[orca.image.end]

*Image created with DALL-E 3*
`;
```

#### When to Use

- **Display Generated Images**: Show images created by AI services
- **Reference Images**: Display images referenced in conversations
- **Visual Results**: Present any visual content as part of agent responses
- **Image Sharing**: Share images between different parts of the conversation

#### Benefits

- **Native Rendering**: Images are displayed natively within the Orca interface
- **Consistent Formatting**: Ensures proper image display across different contexts
- **Rich Content**: Enhances conversations with visual elements
- **User Engagement**: Visual content makes interactions more engaging

## Complete Example

Here's a complete example showing how both components work together:

```javascript
async function generateImageFunction(args, data, orcaHandler) {
  try {
    // Stream function execution start
    const executionMsg = "\n🚀 **Executing function:** generate_image";
    await orcaHandler.streamChunk(data, executionMsg);
    
    // Start loading indicator
    await orcaHandler.streamChunk(data, "[orca.loading.image.start]");
    
    // Generate the image
    const imageUrl = await generateImageWithDALLE(
      args.prompt,
      data.variables,
      args.size || "1024x1024",
      args.quality || "standard",
      args.style || "vivid"
    );
    
    // End loading indicator
    await orcaHandler.streamChunk(data, "[orca.loading.image.end]");
    
    // Stream function completion
    const completionMsg = "\n✅ **Function completed successfully:** generate_image";
    await orcaHandler.streamChunk(data, completionMsg);
    
    // Create response with image
    const imageResult = `
🎨 **Image Generated Successfully!**

**Prompt:** ${args.prompt}
**Image URL:** [orca.image.start]${imageUrl}[orca.image.end]

*Image created with DALL-E 3*
`;
    
    // Stream the final result
    await orcaHandler.streamChunk(data, imageResult);
    
    return {
      success: true,
      message: "Image generated successfully",
      imageUrl: imageUrl
    };
    
  } catch (error) {
    // Handle errors appropriately
    await orcaHandler.streamChunk(data, `❌ **Error:** ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}
```

## Best Practices

1. **Always Use Loading States**: For any operation that takes more than a few seconds, use the loading component
2. **Wrap Image URLs**: Always wrap image URLs with `orca.image` tags for proper display
3. **Provide Context**: Include relevant information about the image (prompt, source, etc.)
4. **Handle Errors**: Implement proper error handling for image generation failures
5. **Stream Progress**: Use streaming to provide real-time feedback to users

## Integration with AI Services

These components work seamlessly with various AI image generation services:

- **OpenAI DALL-E**: For creating images from text prompts
- **Stable Diffusion**: For open-source image generation
- **Midjourney**: For artistic image creation
- **Custom Models**: Any image generation or processing service

The components provide a consistent interface regardless of the underlying image service being used.

