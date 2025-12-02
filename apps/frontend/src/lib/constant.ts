/* eslint-disable @typescript-eslint/no-explicit-any */
export const actionSchemas: Record<string, any> = {
  Telegram: {
    fields: [
      {
        name: "chatId",
        label: "Chat ID",
        type: "text",
        required: true,
        placeholder: "Enter chat ID (e.g., 123456789) or username (e.g., @username or username)",
        description: "Numeric chat ID or username (@ is optional, will be added automatically)"
      },
      {
        name: "message",
        label: "Message",
        type: "textarea",
        required: true,
        placeholder: "Enter your message here...",
        description: "The message content to send"
      },
      {
        name: "parseMode",
        label: "Parse Mode",
        type: "select",
        required: false,
        options: ["None", "HTML", "Markdown", "MarkdownV2"],
        placeholder: "Select parse mode (optional)",
        description: "Format for the message text. None = plain text, HTML/Markdown for rich formatting"
      }
    ]
  },
  GmailTrigger:{
    fields:[]
  },
  
  OpenAi: {
    fields: [
      {
        name: "prompt",
        label: "Prompt",
        type: "textarea",
        required: true,
        placeholder: "Enter your prompt...",
      },
      {
        name: "model",
        label: "Model",
        type: "select",
        required: true,
        options: ["gpt-5-mini", "gpt-5", "gpt-5.1"],
      }
    ]
  },

  OpenRouter: {
    fields: [
      {
        name: "prompt",
        label: "Prompt",
        type: "textarea",
        required: true,
        placeholder: "Enter your prompt...",
      },
      {
        name: "model",
        label: "Model",
        type: "select",
        required: true,
        options: [
          "openai/gpt-5-mini",
          "openai/gpt-5",
          "openai/gpt-3.5-turbo",
          "anthropic/claude-4.5-opus",
          "anthropic/claude-4-sonnet",
          "anthropic/claude-4.5-haiku",
          "google/gemini-3",
        ],
      }
    ]
  },

  WebHookNodeType: {
    fields: [
      {
        name: "url",
        label: "Webhook URL",
        type: "text",
        required: true,
        placeholder: "https://api.example.com/webhook"
      },
      {
        name: "method",
        label: "HTTP Method",
        type: "select",
        required: true,
        options: ["GET", "POST", "PUT", "DELETE", "PATCH"]
      },
      {
        name: "headers",
        label: "Headers (JSON)",
        type: "textarea",
        required: false,
        placeholder: '{"Content-Type": "application/json"}'
      },
      {
        name: "body",
        label: "Request Body",
        type: "textarea",
        required: false,
        placeholder: "Request payload"
      }
    ]
  },

  Resend: {
    fields: [
      {
        name: "from",
        label: "From",
        type: "text",
        required: true,
        placeholder: "sender@yourdomain.com",
        description: "Sender email address (must be from a verified domain in Resend). Example: noreply@yourdomain.com"
      },
      {
        name: "to",
        label: "To",
        type: "text",
        required: true,
        placeholder: "recipient@example.com",
        description: "Recipient email address(es). Use comma-separated for multiple recipients"
      },
      {
        name: "subject",
        label: "Subject",
        type: "text",
        required: true,
        placeholder: "Your email subject",
        description: "Email subject line"
      },
      {
        name: "html",
        label: "HTML Content",
        type: "textarea",
        required: true,
        placeholder: "<h1>Hello</h1><p>Your email content here...</p>",
        description: "Email body in HTML format"
      },
      {
        name: "text",
        label: "Plain Text (Optional)",
        type: "textarea",
        required: false,
        placeholder: "Plain text version of your email...",
        description: "Plain text fallback for email clients that don't support HTML"
      },
      {
        name: "replyTo",
        label: "Reply To (Optional)",
        type: "text",
        required: false,
        placeholder: "replyto@example.com",
        description: "Email address for replies"
      }
    ]
  }
};