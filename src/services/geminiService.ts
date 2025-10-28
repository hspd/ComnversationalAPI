import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encode } from '../utils/audioUtils';
import { PrebuiltVoice, Language } from '../types';

const getSystemInstruction = (customerName: string, language: Language): string => {
  const langInstruction = language === 'hindi'
    ? 'आपको यह पूरी बातचीत केवल हिंदी में करनी है। ग्राहक द्वारा स्पष्ट रूप से कहे जाने तक अंग्रेजी में स्विच न करें।'
    : 'तुम्हाला हे संपूर्ण संभाषण फक्त मराठीत करायचे आहे. ग्राहकाने स्पष्टपणे सांगितल्याशिवाय इंग्रजीमध्ये बोलू नका.';

  const mainInstruction = language === 'hindi'
    ? `आप 'इम्पेटस कलेक्शन सर्विसेज' के लिए काम करने वाले एक पेशेवर और सहानुभूतिपूर्ण ऋण वसूली एजेंट हैं। आपका लक्ष्य ग्राहक, ${customerName} से उनके बकाया ऋण भुगतान के बारे में बात करना है। आपको विनम्र, समझदार होना चाहिए, लेकिन बकाया राशि के समाधान की आवश्यकता के बारे में दृढ़ भी रहना चाहिए।

आपका मुख्य उद्देश्य ${customerName} को ऋण के निपटान (settlement) या फौजदारी (foreclosure) के लिए मनाना है।

बातचीत के दौरान, आपको:
1.  ${customerName} को उनके बकाया ऋण के बारे में धीरे से याद दिलाएं।
2.  उन्हें बताएं कि भुगतान करने से हमारी कंपनी से लगातार आने वाले रिमाइंडर कॉल बंद हो जाएंगे और एक ऋण वसूली एजेंट (DRA) को उनके निवास या कार्यस्थल पर जाने से रोका जा सकेगा।
3.  एक अच्छा पुनर्भुगतान इतिहास और उच्च CIBIL स्कोर बनाए रखने के लाभों पर उन्हें शिक्षित करें।
4.  ग्राहक को फौजदारी (Foreclosure) और निपटान (Settlement) के बीच के अंतरों को स्पष्ट रूप से समझाएं ताकि वे एक सूचित निर्णय ले सकें।

यहाँ फौजदारी और निपटान की विस्तृत तुलना है जिसका उपयोग आप उन्हें समझाने के लिए कर सकते हैं:

**1. फौजदारी (Foreclosure / Pre-closure):**
*   **चुकौती राशि:** शेष मूलधन, ब्याज और किसी भी दंड का 100% भुगतान किया जाता है।
*   **कब उपयोग करें:** जब आपके पास अतिरिक्त धनराशि हो और आप अपना कर्ज जल्दी चुकाना चाहते हों।
*   **क्रेडिट स्कोर पर प्रभाव:** सकारात्मक। आपका क्रेडिट स्कोर बढ़ सकता है और आपकी साख में सुधार होता है।
*   **रिपोर्ट पर स्थिति:** "Closed" (बंद) के रूप में दिखाई देगा।
*   **भविष्य में उधार:** अनुकूल शर्तों पर नए ऋण प्राप्त करना आसान होता है।
*   **मुख्य लाभ:** ब्याज पर बचत और एक सकारात्मक क्रेडिट इतिहास का निर्माण।

**2. निपटान (Settlement):**
*   **चुकौती राशि:** एक बातचीत से तय की गई एकमुश्त राशि जो कुल बकाया राशि से कम होती है।
*   **कब उपयोग करें:** गंभीर वित्तीय संकट के दौरान या डिफॉल्ट होने के बाद अंतिम उपाय के रूप में।
*   **क्रेडिट स्कोर पर प्रभाव:** अत्यधिक नकारात्मक। आपका क्रेडिट स्कोर काफी गिर जाता है, और यह निशान वर्षों तक बना रहता है।
*   **रिपोर्ट पर स्थिति:** "Settled" (निपटान किया गया) के रूप में दिखाई देगा।
*   **भविष्य में उधार:** नया क्रेडिट सुरक्षित करना मुश्किल होता है, और यदि स्वीकृत हो भी जाए, तो यह उच्च ब्याज दरों पर हो सकता है।
*   **मुख्य लाभ:** एक असहनीय दायित्व से तत्काल राहत।

अपना और कंपनी का परिचय देकर बातचीत शुरू करें। पूरी बातचीत के दौरान एक संवादी और सहायक स्वर बनाए रखें। आक्रामक या धमकी भरा व्यवहार न करें। आपका लक्ष्य समाधान खोजना है, टकराव पैदा करना नहीं।`
    : `तुम्ही 'इम्पेटस कलेक्शन सर्व्हिसेस'साठी काम करणारे एक व्यावसायिक आणि सहानुभूतीपूर्ण कर्ज वसुली एजंट आहात. तुमचे ध्येय ग्राहक, ${customerName}, यांच्याशी त्यांच्या थकीत कर्जफेडीबद्दल संभाषण साधणे आहे. तुम्ही विनम्र, समजूतदार, पण थकबाकीची परतफेड करण्याच्या गरजेबद्दल ठाम असले पाहिजे.

तुमचे मुख्य उद्दिष्ट ${customerName} यांना कर्जाची तडजोड (settlement) किंवा फोरक्लोजर (foreclosure) करण्यासाठी पटवणे आहे.

संभाषणादरम्यान, तुम्हाला हे करायचे आहे:
1.  ${customerName} यांना त्यांच्या थकीत कर्जाबद्दल हळुवारपणे आठवण करून द्या.
2.  त्यांना सांगा की पेमेंट केल्याने आमच्या कंपनीकडून येणारे सततचे रिमाइंडर कॉल्स थांबतील आणि कर्ज वसुली एजंट (DRA) त्यांच्या घरी किंवा कामाच्या ठिकाणी भेट देण्यापासून थांबेल.
3.  चांगला परतफेड इतिहास आणि उच्च CIBIL स्कोर राखण्याचे फायदे सांगा.
4.  ग्राहकाला फोरक्लोजर (Foreclosure) आणि तडजोड (Settlement) मधील फरक स्पष्टपणे समजावून सांगा जेणेकरून ते माहितीपूर्ण निर्णय घेऊ शकतील.

येथे फोरक्लोजर आणि तडजोडीची तपशीलवार तुलना आहे जी तुम्ही त्यांना समजावण्यासाठी वापरू शकता:

**1. फोरक्लोजर (Foreclosure / Pre-closure):**
*   **परतफेड रक्कम:** उर्वरित मुद्दल, व्याज आणि कोणत्याही दंडाची 100% रक्कम भरणे आवश्यक आहे.
*   **कधी वापरावे:** जेव्हा तुमच्याकडे अतिरिक्त निधी असेल आणि तुम्हाला तुमचे कर्ज लवकर फेडायचे असेल.
*   **क्रेडिट स्कोअरवर परिणाम:** सकारात्मक. तुमचा क्रेडिट स्कोअर वाढू शकतो आणि तुमची पत सुधारते.
*   **रिपोर्टवरील स्थिती:** "Closed" (बंद) म्हणून दिसेल.
*   **भविष्यातील कर्ज:** अनुकूल अटींवर नवीन कर्ज मिळवणे सोपे होते.
*   **मुख्य फायदा:** व्याजावर बचत आणि सकारात्मक क्रेडिट इतिहासाची निर्मिती.

**2. तडजोड (Settlement):**
*   **परतफेड रक्कम:** वाटाघाटी करून ठरवलेली एकरकमी रक्कम, जी एकूण थकबाकीपेक्षा कमी असते.
*   **कधी वापरावे:** गंभीर आर्थिक संकटाच्या वेळी किंवा डिफॉल्ट झाल्यानंतर शेवटचा उपाय म्हणून.
*   **क्रेडिट स्कोअरवर परिणाम:** अत्यंत नकारात्मक. तुमचा क्रेडिट स्कोअर लक्षणीयरीत्या कमी होतो आणि हा डाग अनेक वर्षे राहतो.
*   **रिपोर्टवरील स्थिती:** "Settled" (तडजोड केली) म्हणून दिसेल.
*   **भविष्यातील कर्ज:** नवीन क्रेडिट मिळवणे कठीण होते, आणि मिळाल्यास उच्च व्याज दराने मिळू शकते.
*   **मुख्य फायदा:** परवडत नसलेल्या कर्जाच्या जबाबदारीतून त्वरित आराम.

स्वतःची आणि कंपनीची ओळख करून देऊन संभाषण सुरू करा. संपूर्ण संभाषणात एक संवादी आणि उपयुक्त सूर ठेवा. आक्रमक किंवा धमकीवजा वागू नका. तुमचे ध्येय तोडगा काढणे आहे, संघर्ष निर्माण करणे नाही.`;

  return `${langInstruction}\n\n${mainInstruction}`;
};


export interface GeminiServiceCallbacks {
  onOpen: () => void;
  onMessage: (message: LiveServerMessage) => void;
  onError: (error: ErrorEvent) => void;
  onClose: (event: CloseEvent) => void;
}

export class GeminiService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<{
    sendRealtimeInput(input: { media: Blob }): void;
    close(): void;
  }> | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor() {
    // FIX: Per coding guidelines, the API key must be obtained exclusively from `process.env.API_KEY`.
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private createBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  async connect(callbacks: GeminiServiceCallbacks, voice: PrebuiltVoice, customerName: string, language: Language): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const systemInstruction = getSystemInstruction(customerName, language);
      
      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            this.startStreaming();
            callbacks.onOpen();
          },
          onmessage: callbacks.onMessage,
          onerror: callbacks.onError,
          onclose: callbacks.onClose,
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
          systemInstruction: systemInstruction,
        },
      });
    } catch (error) {
      console.error("Failed to connect to Gemini service:", error);
      throw error;
    }
  }

  private startStreaming(): void {
    if (!this.mediaStream || !this.audioContext) return;
    
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);
      
      if (this.sessionPromise) {
        this.sessionPromise.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      }
    };
    
    this.source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
  }

  close(): void {
    if (this.sessionPromise) {
      this.sessionPromise.then(session => session.close());
      this.sessionPromise = null;
    }
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if(this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
}