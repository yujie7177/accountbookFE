import { useState, useEffect, useMemo } from 'react';
import { Button } from "@nextui-org/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { Form } from "@nextui-org/form";
import { Select, SelectItem } from "@nextui-org/select";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, getKeyValue } from "@nextui-org/table";
import { DatePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";
import { Input } from "@nextui-org/input";
import { Pagination } from "@nextui-org/pagination";

export default function IndexPage() {
  // 消费品类选项
  const categories = [
    { label: '饮食', key: '饮食' },
    { label: '衣服', key: '衣服' },
    { label: '化妆品', key: '化妆品' },
    { label: '电子产品', key: '电子产品' },
    { label: '家庭用品', key: '家庭用品' },
    { label: '交通', key: '交通' },
    { label: '娱乐', key: '娱乐' },
    { label: '其他', key: '其他' }
  ];
  // 支付方式选项
  const paymentMethods = [{ label: '花呗', key: '花呗' }, { label: '白条', key: '白条' }, { label: '浦发信用卡', key: '浦发信用卡' }, { label: '其他', key: '其他' }];
  // 状态管理
  const [changExpenses, setChangExpenses] = useState<Array<{ id: number, amount: number, date: string, category: string, paymentMethod: string, user: string }>>([]); // 畅的花销
  const [jieExpenses, setJieExpenses] = useState<Array<{ id: number, amount: number, date: string, category: string, paymentMethod: string, user: string }>>([]); // 杰的花销
  const [isOpen, setIsOpen] = useState(true) //弹窗状态
  const [pageChang, setPageChang] = useState(1); // 畅的花销明细翻页
  const [pageJie, setPageJie] = useState(1); // 杰的花销明细翻页
  // 每页显示数据条数
  const rowsPerPage = 5;
  const onOpen = () => {
    setIsOpen(true)
  };
  const onClose = () => {
    setIsOpen(false)
    setAmount('');
    setIsKeyboardVisible(false)
  };
  const [summaryType, setSummaryType] = useState<any>('paymentMethod'); // 汇总类型：category 或 paymentMethod

  // 检测是否为移动设备
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobileDevice = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      };
      setIsMobile(isMobileDevice());
    }
  }, []);

  // 获取当前日期
  const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear(); // 获取年份（如 2023）
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 获取月份（注意月份从 0 开始，需要 +1）
    const day = String(date.getDate()).padStart(2, '0'); // 获取日期
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
  };

  // 获取畅的当月花销记录
  const fetchChangExpenses = async () => {
    try {
      const response = await fetch(
        `https://account-book.yujieyujiedayujie.workers.dev/api/expenses/chang`
      );
      const data = await response.json();
      setChangExpenses(data);
    } catch (error) {
      console.error('Failed to fetch Chang expenses:', error);
    }
  };
  // 获取杰的当月花销记录
  const fetchJieExpenses = async () => {
    try {
      const response = await fetch(
        `https://account-book.yujieyujiedayujie.workers.dev/api/expenses/jie`
      );
      const data = await response.json();
      setJieExpenses(data);
    } catch (error) {
      console.error('Failed to fetch Jie expenses:', error);
    }
  };
  // 页面加载时获取数据
  useEffect(() => {
    fetchChangExpenses();
    fetchJieExpenses();
  }, []);
  // 添加花销
  const addExpense = async (e: { preventDefault: () => void; currentTarget: HTMLFormElement | undefined; }) => {
    try {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(e.currentTarget));
      // 金额验证
      if (!amount || isNaN(parseFloat(amount))) {
        alert('请输入有效的金额');
        return;
      }
      const response = await fetch(`https://account-book.yujieyujiedayujie.workers.dev/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: values.date,
          category: values.category,
          paymentMethod: values.paymentMethod,
          amount: Number(values.amount),
          user: values.user,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      // 重新获取数据
      fetchChangExpenses();
      fetchJieExpenses();
      setAmount(''); // 清空金额输入

    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  // 计算某个用户在某分类下的总花销
  const getTotalByCategory = (expenses: any[], category: string) => {
    return Number(expenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0).toFixed(2));
  };

  // 计算某个用户在某支付方式下的总花销
  const getTotalByPaymentMethod = (expenses: any[], method: string) => {
    return Number(expenses
      .filter((expense) => expense.paymentMethod === method)
      .reduce((sum, expense) => sum + expense.amount, 0).toFixed(2));
  };

  // 根据汇总类型生成汇总数据
  const getSummaryData = () => {
    // 畅和杰的总花销
    const totalChang = Number(changExpenses.reduce((sum: any, e: { amount: any; }) => sum + e.amount, 0));
    const totalJie = Number(jieExpenses.reduce((sum: any, e: { amount: any; }) => sum + e.amount, 0));

    interface SummaryData {
      [key: string]: any; // 索引签名，表示可以接受任意字符串作为属性名
    }
    const summaryDataChangBodyCategory: SummaryData = {}
    const summaryDataChangBodyPaymentMethod: SummaryData = {}
    const summaryDataJieBodyCategory: SummaryData = {}
    const summaryDataJieBodyPaymentMethod: SummaryData = {}

    const summaryDataChangHeader: SummaryData = {
      key: 'chang',
      users: '畅',
      totalExpenses: Math.round(totalChang * 100) / 100,
      remainingAmount: Math.round((1500 - totalChang) * 100) / 100
    };
    const summaryDataJieHeader: SummaryData = {
      key: 'jie',
      users: '杰  ',
      totalExpenses: Math.round(totalJie * 100) / 100,
      remainingAmount: Math.round((1000 - totalJie) * 100) / 100
    };
    categories.forEach(e => {
      summaryDataChangBodyCategory[e.key] = getTotalByCategory(changExpenses, e.key)
      summaryDataJieBodyCategory[e.key] = getTotalByCategory(jieExpenses, e.key)
    });
    paymentMethods.forEach(e => {
      summaryDataChangBodyPaymentMethod[e.key] = getTotalByPaymentMethod(changExpenses, e.key)
      summaryDataJieBodyPaymentMethod[e.key] = getTotalByPaymentMethod(jieExpenses, e.key)
    });

    const summaryDataChang =
      summaryType === 'category'
        ? { ...summaryDataChangHeader, ...summaryDataChangBodyCategory }
        : { ...summaryDataChangHeader, ...summaryDataChangBodyPaymentMethod }
    const summaryDataJie =
      summaryType === 'category'
        ? { ...summaryDataJieHeader, ...summaryDataJieBodyCategory }
        : { ...summaryDataJieHeader, ...summaryDataJieBodyPaymentMethod }

    return [summaryDataChang, summaryDataJie]
  };

  //汇总表格定义
  const getSummaryColumns = () => {
    const summaryColumnsHeader = [
      { key: "users", label: "用户" },
      { key: "totalExpenses", label: "总花销" },
      { key: "remainingAmount", label: "剩余额度" },
    ];
    const summaryColumns =
      summaryType === 'category'
        ? ([...summaryColumnsHeader, ...categories])
        : ([...summaryColumnsHeader, ...paymentMethods])
    return summaryColumns
  };

  // 花销明细表格列定义
  const detailColumns = [
    { label: '日期', key: 'date' },
    { label: '消费品类', key: 'category' },
    { label: '支付方式', key: 'paymentMethod' },
    { label: '支付金额', key: 'amount' },
    { label: '用户', key: 'user' }, // 显示用户名称
  ];

  // 控制翻页
  const pagesJie = Math.ceil(jieExpenses.length / rowsPerPage);
  const pagesChang = Math.ceil(changExpenses.length / rowsPerPage);
  const itemsJie = useMemo(() => {
    const startJie = (pageJie - 1) * rowsPerPage;
    const endJie = startJie + rowsPerPage;
    return jieExpenses.slice(startJie, endJie);
  }, [pageJie, jieExpenses]);
  const itemsChang = useMemo(() => {
    const startChang = (pageChang - 1) * rowsPerPage;
    const endChang = startChang + rowsPerPage;
    return changExpenses.slice(startChang, endChang);
  }, [pageChang, changExpenses]);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // 控制键盘显示与隐藏

  // 自定义数字键盘组件
  const NumberKeyboard = ({ value, onChange, onComplete }: { value: string; onChange: (value: string) => void; onComplete: () => void }) => {
    const handleKeyPress = (key: string) => {
      let newValue = value;

      if (key === 'backspace') {
        newValue = newValue.slice(0, -1); // 删除最后一个字符
      } else if (key === '-') {
        if (!newValue.includes('-')) {
          newValue = key + newValue; // 只能在开头添加负号
        }
      } else if (key === '.') {
        if (!newValue.includes('.')) {
          newValue += key; // 只能添加一个小数点
        }
      } else {
        newValue += key; // 添加数字
      }

      onChange(newValue);
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
        {['7', '8', '9', '4', '5', '6', '1', '2', '3', '-', '0', '.'].map((key) => (
          <Button key={key} onPress={() => handleKeyPress(key)}>
            {key}
          </Button>
        ))}
        {/* 删除和完成按钮 */}
        <Button onPress={onComplete} color="primary" style={{ gridColumn: '1 / 3' }}>
          完成
        </Button>
        <Button color="danger" onPress={() => handleKeyPress('backspace')} style={{ gridColumn: '3 / 4' }}>
          ⌫
        </Button>
        {/* <div style={{ gridColumn: '2 / 3' }} /> */}
      </div>
    );
  };
  const [amount, setAmount] = useState(''); // 金额输入

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* 弹窗表单 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <Form onSubmit={addExpense} validationBehavior="native">
          <ModalContent>
            {
              <>
                <ModalHeader className="flex flex-col gap-1">添加花销</ModalHeader>
                <ModalBody>
                  <DatePicker className="max-w-[284px]" name="date" isRequired defaultValue={parseDate(getCurrentDate())} label="请选择消费日期" />
                  <Select className="max-w-[284px]" name="category" isRequired defaultSelectedKeys={["衣服"]} label="请选择消费品类" items={categories}>
                    {(item) => <SelectItem>{item.label}</SelectItem>}
                  </Select>
                  <Select className="max-w-[284px]" name="paymentMethod" isRequired defaultSelectedKeys={["花呗"]} label="请选择支付方式" items={paymentMethods}>
                    {(item) => <SelectItem>{item.label}</SelectItem>}
                  </Select>
                  {isMobile ? (
                    <>
                      <Input
                        className="max-w-[284px]"
                        name="amount"
                        isRequired
                        type="text"
                        label="请输入金额"
                        value={amount}
                        readOnly
                        onFocus={(e) => {
                          e.target.blur(); // 阻止原生键盘弹出
                          setIsKeyboardVisible(true); // 显示自定义键盘
                        }}
                      />
                      {isKeyboardVisible && (
                        <NumberKeyboard
                          value={amount}
                          onChange={setAmount}
                          onComplete={() => setIsKeyboardVisible(false)} // 点击“完成”按钮后隐藏键盘
                        />
                      )}
                    </>
                  ) : (
                    <Input
                      className="max-w-[284px]"
                      name="amount"
                      isRequired
                      type="number" // 非移动设备使用原生输入
                      label="请输入金额"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)} // 直接更新金额
                    />
                  )}
                  <Select className="max-w-[284px]" name="user" isRequired defaultSelectedKeys={["畅"]} label="请选择用户" items={[{ label: '畅', key: '畅' }, { label: '杰', key: '杰' }]}>
                    {(item) => <SelectItem>{item.label}</SelectItem>}
                  </Select>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    关闭
                  </Button>
                  <Button type='submit' color="primary" onPress={onClose}>
                    添加
                  </Button>
                </ModalFooter>
              </>
            }
          </ModalContent>
        </Form>
      </Modal>

      {/* 汇总部分 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <Select className="max-w-[16rem] md:max-w-xs" label="选择汇总方式" defaultSelectedKeys={["paymentMethod"]} onSelectionChange={(selectedKeys) => setSummaryType(selectedKeys['currentKey'])}>
            <SelectItem key="category">按消费品类汇总</SelectItem>
            <SelectItem key="paymentMethod">按支付方式汇总</SelectItem>
          </Select>
          {/* 添加数据按钮 */}
          <Button color="primary" onPress={onOpen} className='float-right'>添加数据</Button>
        </div>
        <Table>
          <TableHeader columns={getSummaryColumns()} >
            {(column: { key: string; label: string; }) => <TableColumn key={column.key}>{column.label}</TableColumn>}
          </TableHeader>
          <TableBody emptyContent={"No rows to display."} items={getSummaryData()}>
            {(item) => (
              <TableRow key={item.key}>
                {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 畅和杰的花销明细 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Table bottomContent={
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="secondary"
                initialPage={1}
                page={pageChang}
                total={pagesChang}
                onChange={(pageChang) => setPageChang(pageChang)}
              />
            </div>
          }>
            <TableHeader columns={detailColumns} >
              {(column: { key: string; label: string; }) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody emptyContent={"No rows to display."} items={itemsChang}>
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div>
          <Table bottomContent={
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="secondary"
                initialPage={1}
                page={pageJie}
                total={pagesJie}
                onChange={(pageJie) => setPageJie(pageJie)}
              />
            </div>
          }>
            <TableHeader columns={detailColumns} >
              {(column: { key: string; label: string; }) => <TableColumn key={column.key}>{column.label}</TableColumn>}
            </TableHeader>
            <TableBody emptyContent={"No rows to display."} items={itemsJie}>
              {(item) => (
                <TableRow key={item.id}>
                  {(columnKey) => <TableCell>{getKeyValue(item, columnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
