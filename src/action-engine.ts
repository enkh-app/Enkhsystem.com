export type ActionId =
  | 'message'
  | 'reminder'
  | 'document'
  | 'search'
  | 'text'
  | 'calculation'
  | 'prepare'
  | 'custom';

export type ActionStatus =
  | 'idle'
  | 'running'
  | 'success'
  | 'error';

export type ActionInput = {
  actionId: ActionId;
  input: string;
};

export type CalculationResult = {
  type: 'calculation';
  originalInput: string;
  baseValue: number;
  extraPercent: number;
  extraValue: number;
  totalValue: number;
  unit: string;
};

export type ActionExecutionData = {
  actionId: ActionId;
  input: string;
  title: string;
  executedAt: string;
  result?: CalculationResult;
};

export type ActionResult = {
  success: boolean;
  actionId: ActionId;
  status: ActionStatus;
  message: string;
  data?: ActionExecutionData;
};

export type ActionDefinition = {
  id: ActionId;
  icon: string;
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  examples: string[];
};

export const ACTIONS: ActionDefinition[] = [
  {
    id: 'message',
    icon: '💬',
    title: 'Мессеж илгээх',
    description: 'Мессеж бичиж илгээх үйлдэл',
    inputLabel: 'Мессежийн мэдээлэл',
    placeholder: 'Хэнд ямар мессеж илгээхийг бичнэ үү...',
    examples: [
      'Батад маргааш 10:00 цагийн уулзалтыг сануулах мессеж бич',
      'Харилцагчид төлбөрийн талаар эелдэг мессеж бэлд',
    ],
  },
  {
    id: 'reminder',
    icon: '⏰',
    title: 'Сануулах',
    description: 'Сануулагч үүсгэх',
    inputLabel: 'Сануулах мэдээлэл',
    placeholder: 'Юуг, хэзээ сануулахыг бичнэ үү...',
    examples: [
      'Маргааш 09:00 цагт МАК уулзалтыг сануул',
      'Баасан гарагт XPS захиалгаа шалгахыг сануул',
    ],
  },
  {
    id: 'document',
    icon: '📄',
    title: 'Баримт боловсруулах',
    description: 'Баримт бичигтэй ажиллах',
    inputLabel: 'Баримтын мэдээлэл',
    placeholder: 'Ямар баримт боловсруулахыг бичнэ үү...',
    examples: [
      'Энэ мэдээллээр албан бичиг бэлд',
      'Гэрээний гол нөхцөлүүдийг нэгтгэ',
    ],
  },
  {
    id: 'search',
    icon: '🔎',
    title: 'Мэдээлэл хайх',
    description: 'Мэдээлэл хайлт эхлүүлэх',
    inputLabel: 'Хайлтын мэдээлэл',
    placeholder: 'Юу хайхыг хүсэж байгаагаа бичнэ үү...',
    examples: [
      '40 мм поликарбонатын үнэ болон үзүүлэлтийг хай',
      'Эрээн дэх сэргээгдэх эрчим хүчний бараа нийлүүлэгч хай',
    ],
  },
  {
    id: 'text',
    icon: '📝',
    title: 'Текст боловсруулах',
    description: 'Текст бичих, засах, боловсруулах',
    inputLabel: 'Текстийн мэдээлэл',
    placeholder: 'Бичих, засах эсвэл боловсруулах текстээ оруулна уу...',
    examples: [
      'Энэ текстийг илүү мэргэжлийн болго',
      'Энэ мэдээллээр богино танилцуулга бич',
    ],
  },
  {
    id: 'calculation',
    icon: '🧮',
    title: 'Тооцолох',
    description: 'Тооцоолол болон математик үйлдэл',
    inputLabel: 'Тооцооллын мэдээлэл',
    placeholder: 'Тооцоо хийх мэдээллээ оруулна уу...',
    examples: [
      '520 м² мембран, 8% илүүдэлтэй хэдэн м² хэрэгтэй вэ?',
      '130 м³ XPS-ийг м² болгон тооцоол',
    ],
  },
  {
    id: 'prepare',
    icon: '📋',
    title: 'Мэдээлэл бэлтгэх',
    description: 'Мэдээллийг нэгтгэж бэлтгэх',
    inputLabel: 'Бэлтгэх мэдээлэл',
    placeholder: 'Ямар мэдээллийг нэгтгэж бэлтгэхийг бичнэ үү...',
    examples: [
      'Энэ төслийн уулзалтын мэдээллийг нэгтгэ',
      'Материалын захиалгын жагсаалт бэлтгэ',
    ],
  },
  {
    id: 'custom',
    icon: '⚡',
    title: 'Custom Action',
    description: 'Өөрийн үйлдэл үүсгэх',
    inputLabel: 'Action-ийн мэдээлэл',
    placeholder: 'ENKH-ээр юу хийлгэхээ бичнэ үү...',
    examples: [
      'Энэ мэдээллийг боловсруулаад товч тайлбарла',
      'Энэ ажлыг хийх дарааллыг гарга',
    ],
  },
];

export function getAction(
  actionId: ActionId
): ActionDefinition | undefined {
  return ACTIONS.find(
    (action) => action.id === actionId
  );
}

export function validateActionInput(
  input: ActionInput
): boolean {
  return (
    input.actionId.length > 0 &&
    input.input.trim().length > 0
  );
}

function createCalculationResult(
  input: string
): CalculationResult | undefined {
  const valueMatch = input.match(
    /(\d+(?:[.,]\d+)?)\s*(?:м²|m²|м2|m2|м3|m³|м|m)?/i
  );

  const percentMatch = input.match(
    /(\d+(?:[.,]\d+)?)\s*%/
  );

  if (!valueMatch || !percentMatch) {
    return undefined;
  }

  const baseValue = Number(
    valueMatch[1].replace(',', '.')
  );

  const extraPercent = Number(
    percentMatch[1].replace(',', '.')
  );

  if (
    !Number.isFinite(baseValue) ||
    !Number.isFinite(extraPercent)
  ) {
    return undefined;
  }

  const extraValue =
    baseValue * (extraPercent / 100);

  const totalValue =
    baseValue + extraValue;

  const unitMatch = input.match(
    /(м²|m²|м2|m2|м³|m³|м|m)/i
  );

  const unit = unitMatch?.[1] || '';

  return {
    type: 'calculation',
    originalInput: input,
    baseValue,
    extraPercent,
    extraValue,
    totalValue,
    unit,
  };
}

export async function executeAction(
  actionInput: ActionInput
): Promise<ActionResult> {
  if (!validateActionInput(actionInput)) {
    return {
      success: false,
      actionId: actionInput.actionId,
      status: 'error',
      message: 'Action-ийн мэдээлэл дутуу байна.',
    };
  }

  const action = getAction(actionInput.actionId);

  if (!action) {
    return {
      success: false,
      actionId: actionInput.actionId,
      status: 'error',
      message: 'Ийм Action бүртгэлгүй байна.',
    };
  }

  const input = actionInput.input.trim();

  const executionData: ActionExecutionData = {
    actionId: action.id,
    input,
    title: action.title,
    executedAt: new Date().toISOString(),
  };

  if (action.id === 'calculation') {
    const calculation = createCalculationResult(input);

    if (calculation) {
      executionData.result = calculation;

      return {
        success: true,
        actionId: action.id,
        status: 'success',
        message: 'Тооцоолол амжилттай хийгдлээ.',
        data: executionData,
      };
    }

    return {
      success: true,
      actionId: action.id,
      status: 'success',
      message:
        'Тооцооллын мэдээллийг хүлээж авлаа. Илүү нарийн тооцоолол хийхэд шаардлагатай утгуудыг тодорхойлно.',
      data: executionData,
    };
  }

  return {
    success: true,
    actionId: action.id,
    status: 'success',
    message: `${action.title} үйлдлийг ажиллуулахад бэлэн.`,
    data: executionData,
  };
}
