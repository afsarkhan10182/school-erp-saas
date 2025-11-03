<template>
  <div class="rich-text-editor">
    <!-- Toolbar -->
    <div class="toolbar border border-gray-300 dark:border-gray-600 rounded-t-md bg-white dark:bg-gray-800 px-3 py-2 border-b">
      <div class="flex items-center gap-1 flex-wrap">
        <!-- Text Formatting -->
        <button
          type="button"
          @click="editor?.chain().focus().toggleBold().run()"
          :class="[
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            editor?.isActive('bold') ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600' : 'text-gray-600 dark:text-gray-400'
          ]"
          title="Bold"
        >
          <Bold class="h-4 w-4" />
        </button>

        <button
          type="button"
          @click="editor?.chain().focus().toggleItalic().run()"
          :class="[
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            editor?.isActive('italic') ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600' : 'text-gray-600 dark:text-gray-400'
          ]"
          title="Italic"
        >
          <Italic class="h-4 w-4" />
        </button>

        <button
          type="button"
          @click="editor?.chain().focus().toggleUnderline().run()"
          :class="[
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            editor?.isActive('underline') ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600' : 'text-gray-600 dark:text-gray-400'
          ]"
          title="Underline"
        >
          <Underline class="h-4 w-4" />
        </button>

        <div class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <!-- Alignment -->
        <button
          type="button"
          @click="editor?.chain().focus().setTextAlign('left').run()"
          :class="[
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600' : 'text-gray-600 dark:text-gray-400'
          ]"
          title="Left"
        >
          <AlignLeft class="h-4 w-4" />
        </button>

        <button
          type="button"
          @click="editor?.chain().focus().setTextAlign('center').run()"
          :class="[
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600' : 'text-gray-600 dark:text-gray-400'
          ]"
          title="Center"
        >
          <AlignCenter class="h-4 w-4" />
        </button>

        <button
          type="button"
          @click="editor?.chain().focus().setTextAlign('right').run()"
          :class="[
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600' : 'text-gray-600 dark:text-gray-400'
          ]"
          title="Right"
        >
          <AlignRight class="h-4 w-4" />
        </button>

        <div class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <!-- Lists -->
        <button
          type="button"
          @click="editor?.chain().focus().toggleBulletList().run()"
          :class="[
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            editor?.isActive('bulletList') ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600' : 'text-gray-600 dark:text-gray-400'
          ]"
          title="Bullet List"
        >
          <List class="h-4 w-4" />
        </button>

        <button
          type="button"
          @click="editor?.chain().focus().toggleOrderedList().run()"
          :class="[
            'p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
            editor?.isActive('orderedList') ? 'bg-gray-100 dark:bg-gray-700 text-indigo-600' : 'text-gray-600 dark:text-gray-400'
          ]"
          title="Numbered List"
        >
          <ListOrdered class="h-4 w-4" />
        </button>

        <div class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>

        <!-- Insert Tag Button -->
        <div class="relative ml-auto">
          <button
            type="button"
            @click="showTagMenu = !showTagMenu"
            class="px-3 py-1.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors text-xs font-medium flex items-center gap-1.5"
          >
            <Tag class="h-3.5 w-3.5" />
            <span>Insert Tag</span>
          </button>
        </div>
      </div>

      <!-- Tag Menu -->
      <div
        v-if="showTagMenu"
        class="absolute right-0 z-20 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg w-64 max-h-60 overflow-y-auto"
      >
        <div class="p-2">
          <div class="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">Click to insert:</div>
          <div class="space-y-0.5">
            <button
              type="button"
              v-for="tag in availableTags"
              :key="tag"
              @click="insertTag(tag)"
              class="w-full text-left px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
            >
              {<span class="font-medium text-indigo-600 dark:text-indigo-400">{{ tag }}</span>}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Content -->
    <div
      class="editor-content border-l border-r border-b border-gray-300 dark:border-gray-600 rounded-b-md"
    >
      <editor-content
        :editor="editor"
        class="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none cursor-text"
        :class="[
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          'prose-headings:text-gray-900 dark:prose-headings:text-white',
          'prose-p:text-gray-700 dark:prose-p:text-gray-300',
          'prose-strong:text-gray-900 dark:prose-strong:text-white'
        ]"
        @click="handleEditorClick"
      />
    </div>

    <!-- Character Count -->
    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
      {{ content.length }} characters
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Tag } from 'lucide-vue-next';

// Custom extension for dynamic tags
const DynamicTag = {
  name: 'dynamicTag',
  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          'data-dynamic-tag': {
            default: null,
            parseHTML: element => element.getAttribute('data-dynamic-tag'),
            renderHTML: attributes => {
              if (!attributes['data-dynamic-tag']) {
                return {};
              }
              return {
                'data-dynamic-tag': attributes['data-dynamic-tag'],
                class: 'dynamic-tag'
              };
            }
          }
        }
      }
    ];
  }
};

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  availableTags: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Enter your content here...'
  }
});

// Emits
const emit = defineEmits(['update:modelValue']);

// Reactive data
const editor = ref(null);
const showTagMenu = ref(false);
const content = ref(props.modelValue);

// Initialize editor
onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      DynamicTag
    ],
    content: processContentForTags(props.modelValue),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        placeholder: props.placeholder
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      content.value = html;
      emit('update:modelValue', html);
    }
  });
});

// Watch for external changes
watch(
  () => props.modelValue,
  newValue => {
    if (editor.value && newValue !== editor.value.getHTML()) {
      editor.value.commands.setContent(processContentForTags(newValue));
    }
  }
);

// Methods
const setTextColor = color => {
  if (color && editor.value) {
    editor.value.chain().focus().setColor(color).run();
  }
};


const insertTag = tag => {
  if (editor.value) {
    // Insert the tag with proper styling
    editor.value
      .chain()
      .focus()
      .insertContent(
        `<span class="dynamic-tag" data-tag="${tag}" contenteditable="false">{${tag}}</span>`
      )
      .run();
    showTagMenu.value = false;
  }
};

const handleEditorClick = () => {
  if (editor.value) {
    editor.value.commands.focus();
  }
};

const processContentForTags = content => {
  if (!content) return '';

  // Convert plain {tag} patterns to styled tags
  return content.replace(
    /\{([^}]+)\}/g,
    '<span class="dynamic-tag" data-tag="$1" contenteditable="false">{$1}</span>'
  );
};

// Cleanup
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});
</script>

<style scoped>
.rich-text-editor {
  position: relative;
}

.toolbar {
  position: relative;
}

/* Ensure cursor is always visible in editor */
.editor-content :deep(.ProseMirror) {
  cursor: text !important;
  caret-color: #3b82f6;
}

.editor-content :deep(.ProseMirror:focus) {
  outline: none;
}

/* Ensure dynamic tags are properly rendered */
.editor-content :deep(.ProseMirror) {
  line-height: 1.6;
}

.editor-content :deep(.ProseMirror p) {
  margin: 0.5em 0;
}

/* Make sure dynamic tags don't get overridden by prose styles */
.editor-content :deep(.ProseMirror .dynamic-tag) {
  all: unset !important;
  display: inline-block !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  padding: 4px 10px !important;
  border-radius: 12px !important;
  font-size: 0.75rem !important;
  font-weight: 500 !important;
  margin: 0 3px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  user-select: none !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
  position: relative !important;
  z-index: 1 !important;
}

/* Style dynamic tags to look like actual tags */
.editor-content :deep(.dynamic-tag) {
  display: inline-block !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  padding: 4px 10px !important;
  border-radius: 12px !important;
  font-size: 0.75rem !important;
  font-weight: 500 !important;
  margin: 0 3px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  user-select: none !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
  position: relative !important;
  z-index: 1 !important;
}

.editor-content :deep(.dynamic-tag:hover) {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25) !important;
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
}

.editor-content :deep(.dynamic-tag::before) {
  content: '🏷️' !important;
  margin-right: 6px !important;
  font-size: 0.8rem !important;
  display: inline-block !important;
}

/* Custom scrollbar for tag menu */
.tag-menu::-webkit-scrollbar {
  width: 4px;
}

.tag-menu::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.tag-menu::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.tag-menu::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Dark mode scrollbar */
.dark .tag-menu::-webkit-scrollbar-track {
  background: #374151;
}

.dark .tag-menu::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.dark .tag-menu::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
