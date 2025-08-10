import { useState, useCallback } from 'react';

export interface Template {
  id: string;
  title: string;
  prompt: string;
  category: string;
  isFavorite?: boolean;
}

const defaultTemplates: Template[] = [
  {
    id: '1',
    title: 'Analyze Conversation',
    prompt: 'Please analyze the following WhatsApp conversation and provide insights about:\n1. The tone and sentiment\n2. Key topics discussed\n3. Any action items or follow-ups needed\n\nConversation: [Paste conversation here]',
    category: 'Analysis'
  },
  {
    id: '2',
    title: 'Draft Professional Reply',
    prompt: 'Help me draft a professional reply to this WhatsApp message:\n\nOriginal message: [Paste message here]\n\nContext: [Provide context about the relationship/situation]\n\nTone should be: [professional/friendly/formal]',
    category: 'Writing'
  },
  {
    id: '3',
    title: 'Summarize Long Thread',
    prompt: 'Please summarize this long WhatsApp conversation thread into key points:\n\n[Paste conversation thread here]\n\nPlease organize the summary by:\n1. Main topics discussed\n2. Decisions made\n3. Action items\n4. Next steps',
    category: 'Summarization'
  },
  {
    id: '4',
    title: 'Customer Service Response',
    prompt: 'Help me write a customer service response for this WhatsApp inquiry:\n\nCustomer message: [Paste customer message]\n\nIssue category: [billing/technical/general]\n\nDesired outcome: [resolution/escalation/information]',
    category: 'Customer Service'
  },
  {
    id: '5',
    title: 'Meeting Follow-up',
    prompt: 'Create a follow-up message for this WhatsApp business conversation:\n\nMeeting details: [Provide meeting context]\n\nKey discussion points: [List main topics]\n\nNext steps: [What needs to happen next]',
    category: 'Business'
  }
];

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);

  const toggleFavorite = useCallback((templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, isFavorite: !template.isFavorite }
        : template
    ));
  }, []);

  const addTemplate = useCallback((newTemplate: Omit<Template, 'id'>) => {
    const template: Template = {
      ...newTemplate,
      id: Date.now().toString()
    };
    setTemplates(prev => [...prev, template]);
    return template;
  }, []);

  const updateTemplate = useCallback((templateId: string, updates: Partial<Template>) => {
    setTemplates(prev => prev.map(template =>
      template.id === templateId
        ? { ...template, ...updates }
        : template
    ));
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.filter(template => template.id !== templateId));
  }, []);

  const getTemplatesByCategory = useCallback((category?: string) => {
    if (!category) return templates;
    return templates.filter(template => template.category === category);
  }, [templates]);

  const getFavoriteTemplates = useCallback(() => {
    return templates.filter(template => template.isFavorite);
  }, [templates]);

  return {
    templates,
    toggleFavorite,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByCategory,
    getFavoriteTemplates
  };
};
