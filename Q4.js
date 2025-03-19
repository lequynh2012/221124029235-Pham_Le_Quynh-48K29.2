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
    d.Ngày = new Date(d["Thời gian tạo đơn"]).getDay();
  });

  const weekdays = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
  const weekdayOrder = {1: "Thứ Hai", 2: "Thứ Ba", 3: "Thứ Tư", 4: "Thứ Năm", 5: "Thứ Sáu", 6: "Thứ Bảy", 0: "Chủ Nhật"};

  const groupedData = d3.group(rawData, d => d.Ngày);

  const data = Array.from(groupedData, ([ngay, orders]) => {
    const doanhThuTong = d3.sum(orders, d => d["Thành tiền"]);
    const soLuongTong = d3.sum(orders, d => d["Số lượng"]);
    const soNgayCoDon = new Set(orders.map(d => d["Thời gian tạo đơn"].split(" ")[0])).size;

    const doanhThuTB = soNgayCoDon > 0 ? doanhThuTong / soNgayCoDon : 0;
    const soLuongTB = soNgayCoDon > 0 ? soLuongTong / soNgayCoDon : 0;

    return { Ngày: weekdayOrder[ngay], doanhThuTB, soLuongTB };
  });

  data.sort((a, b) => weekdays.indexOf(a.Ngày) - weekdays.indexOf(b.Ngày));

  const color = d3.scaleOrdinal(d3.schemeTableau10);

  const x = d3.scaleBand()
              .domain(data.map(d => d.Ngày))
              .range([0, width])
              .padding(0.2);

  const y = d3.scaleLinear()
              .domain([0, d3.max(data, d => d.doanhThuTB)])
              .nice()
              .range([height, 0]);

  svg.append("g")
     .attr("transform", `translate(0, ${height})`)
     .call(d3.axisBottom(x))
     .append("text")
     .attr("x", width / 2)
     .attr("y", 40)
     .attr("fill", "black");

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
     .attr("x", d => x(d.Ngày))
     .attr("y", d => y(d.doanhThuTB))
     .attr("width", x.bandwidth())
     .attr("height", d => height - y(d.doanhThuTB))
     .attr("fill", d => color(d.Ngày))
     .on("mouseover", (event, d) => {
       tooltip.style("display", "block")
              .html(`Ngày trong tuần: <strong>${d.Ngày}</strong><br>
                     Doanh số bán TB: ${d3.format(",.0f")(d.doanhThuTB)} <br>`)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 20}px`);
     })

     .on("mouseout", () => {
       tooltip.style("display", "none");
     });

  svg.selectAll(".label")
     .data(data)
     .enter()
     .append("text")
     .attr("x", d => x(d.Ngày) + x.bandwidth() / 2)
     .attr("y", d => y(d.doanhThuTB) + 15)
     .attr("text-anchor", "middle")
     .style('font-size','12px')
     .style('fill', 'white')
     .text(d => `${d3.format(",.0f")(d.doanhThuTB)} VND`);
}).catch(error => {
  console.error("Lỗi khi load file CSV:", error);
});
