const margin = {top: 20, right: 100, bottom: 50, left: 200},
      width = 1650 - margin.left - margin.right,
      height = 800 - margin.top - margin.bottom;
const svg = d3.select("#chart")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

d3.csv("data_ggsheet.csv").then(rawData => {
  rawData.forEach(d => {
    d["Thành tiền"] = +d["Thành tiền"];
    d["Số lượng"] = +d["Số lượng"];
    let date = new Date(d["Thời gian tạo đơn"]);
    if (!isNaN(date.getTime())) {
      d.Tháng = date.getMonth() + 1;
      d.Giờ = date.getHours();
      d.Ngày = date.toISOString().split('T')[0];
    }
  });

  const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00-${i.toString().padStart(2, '0')}:59`);

  const filteredData = rawData.filter(d => d.Giờ >= 8 && d.Giờ <= 23);
  const groupedData = d3.group(filteredData, d => d.Giờ);

  const data = [];
  groupedData.forEach((orders, hour) => {
    const uniqueDays = new Set(orders.map(d => d.Ngày)).size;
    const doanhSoBanTB = uniqueDays > 0 ? d3.sum(orders, d => d["Thành tiền"]) / uniqueDays : 0;
    data.push({ KhungGiờ: timeSlots[hour], doanhSoBanTB, Giờ: hour });
  });

  const x = d3.scaleBand()
              .domain(timeSlots.slice(8, 24))
              .range([0, width])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.doanhSoBanTB)])
              .nice()
              .range([height, 0]);

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  svg.append("g")
     .attr("transform", `translate(0, ${height})`)
     .call(d3.axisBottom(x).tickSize(0))
     .selectAll("text")
     .attr("transform", "rotate(-45)")
     .style("text-anchor", "end");

  svg.append("g")
     .call(d3.axisLeft(y)
             .ticks(10)
             .tickFormat(d3.format(".1s"))
             .tickSizeOuter(0));

  svg.selectAll(".bar")
     .data(data)
     .enter()
     .append("rect")
     .attr("class", "bar")
     .attr("x", d => x(d.KhungGiờ))
     .attr("y", d => y(d.doanhSoBanTB))
     .attr("width", x.bandwidth())
     .attr("height", d => height - y(d.doanhSoBanTB))
     .attr("fill", d => color(d.Giờ))
     .on("mouseover", (event, d) => {
       tooltip.style("display", "block")
              .html(`Khung Giờ: ${d.KhungGiờ}<br>
                     Doanh số bán TB: ${d3.format(",.2f")(d.doanhSoBanTB)} `)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
     })
     .on("mousemove", event => {
       tooltip.style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
     })
     .on("mouseout", () => {
       tooltip.style("display", "none");
     });

  svg.selectAll(".label")
     .data(data)
     .enter()
     .append("text")
     .attr("class", "label")
     .attr("x", d => x(d.KhungGiờ) + x.bandwidth() / 2)
     .attr("y", d => y(d.doanhSoBanTB) + 15)
     .attr("text-anchor", "middle")
     .style ('font-size','10')
     .style('fill', 'white')
     .text(d => {
       let doanhSo = d.doanhSoBanTB / 1000; // Đổi sang đơn vị nghìn
       return d3.format(".1f")(doanhSo) + "K"; // Làm tròn và thêm "K"
     });
}).catch(error => {
  console.error("Lỗi khi load file CSV:", error);
});
