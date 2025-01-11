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
  const categories = [{ label: '衣服', key: '衣服' }, { label: '化妆品', key: '化妆品' }, { label: '电子产品', key: '电子产品' }, { label: '家居用品', key: '家居用品' }, { label: '其他', key: '其他' }];
  // 支付方式选项
  const paymentMethods = [{ label: '花呗', key: '花呗' }, { label: '白条', key: '白条' }, { label: '浦发信用卡', key: '浦发信用卡' }, { label: '其他', key: '其他' }];
  // 状态管理
  const [changExpenses, setChangExpenses] = useState<Array<{ id: number, amount: number, date: string, category: string, paymentMethod: string, user: string }>>([]); // 畅的花销
  const [jieExpenses, setJieExpenses] = useState<Array<{ id: number, amount: number, date: string, category: string, paymentMethod: string, user: string }>>([]); // 杰的花销
  const [isOpen, setIsOpen] = useState(true)
  const [pageChang, setPageChang] = useState(1);
  const [pageJie, setPageJie] = useState(1);
  // 每页显示数据条数
  const rowsPerPage = 5;
  const onOpen = () => {
    setIsOpen(true)
  };
  const onClose = () => {
    setIsOpen(false)
  };
  const [summaryType, setSummaryType] = useState<any>('paymentMethod'); // 汇总类型：category 或 paymentMethod

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
        `https://account-book.post.jieyuu.us.kg/api/expenses/chang`
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
        `https://account-book.post.jieyuu.us.kg/api/expenses/jie`
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
      const response = await fetch(`https://account-book.post.jieyuu.us.kg/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: values.date,
          category: values.category,
          paymentMethod: values.paymentMethod,
          amount: values.amount,
          user: values.user,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      // 重新获取数据
      fetchChangExpenses();
      fetchJieExpenses();

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
    const totalChang = changExpenses.reduce((sum: any, e: { amount: any; }) => sum + e.amount, 0);
    const totalJie = jieExpenses.reduce((sum: any, e: { amount: any; }) => sum + e.amount, 0);

    interface SummaryData {
      [key: string]: any; // 索引签名，表示可以接受任意字符串作为属性名
    }

    const summaryDataChangHeader: SummaryData = {
      key: 'chang',
      users: '畅',
      totalExpenses: Number(totalChang.toFixed(2)),
      remainingAmount: 1500 - Number(totalChang.toFixed(2))
    };
    const summaryDataJieHeader: SummaryData = {
      key: 'jie',
      users: '杰  ',
      totalExpenses: Number(totalJie.toFixed(2)),
      remainingAmount: 1000 - Number(totalJie.toFixed(2))
    };
    const summaryDataChangBodyCategory: SummaryData = {}
    const summaryDataChangBodyPaymentMethod: SummaryData = {}
    categories.forEach(e => {
      summaryDataChangBodyCategory[e.key] = getTotalByCategory(changExpenses, e.key)
    });
    paymentMethods.forEach(e => {
      summaryDataChangBodyPaymentMethod[e.key] = getTotalByPaymentMethod(changExpenses, e.key)
    });
    const summaryDataJieBodyCategory: SummaryData = {}
    const summaryDataJieBodyPaymentMethod: SummaryData = {}
    categories.forEach(e => {
      summaryDataJieBodyCategory[e.key] = getTotalByCategory(jieExpenses, e.key)
    });
    paymentMethods.forEach(e => {
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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>


      {/* <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <Button color="primary" onPress={onOpen}>添加数据</Button>
      </div> */}

      {/* 弹窗表单 */}
      <Modal isOpen={isOpen} hideCloseButton={true}>
        <Form onSubmit={addExpense} validationBehavior="native">
          <ModalContent>
            {
              // (onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">添加花销</ModalHeader>
                <ModalBody>
                  <DatePicker name="date" isRequired defaultValue={parseDate(getCurrentDate())} className="max-w-[284px]" label="请选择消费日期" />
                  <Select name="category" isRequired defaultSelectedKeys={["衣服"]} label="请选择消费品类" className="max-w-[284px]" items={categories}>
                    {(item) => <SelectItem>{item.label}</SelectItem>}
                  </Select>
                  <Select name="paymentMethod" isRequired defaultSelectedKeys={["花呗"]} label="请选择支付方式" className="max-w-[284px]" items={paymentMethods}>
                    {(item) => <SelectItem>{item.label}</SelectItem>}
                  </Select>
                  <Input name="amount" isRequired type="number" label="请输入金额" className="max-w-[284px]" />
                  <Select name="user" isRequired defaultSelectedKeys={["畅"]} label="请选择用户" className="max-w-[284px]" items={[{ label: '畅', key: '畅' }, { label: '杰', key: '杰' }]}>
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
              // )
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

      {/* 中部：畅和杰的花销明细 */}
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
